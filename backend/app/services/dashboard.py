import json
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.detection_rule import DetectionRule
from app.models.hunting_result import HuntingResult
from app.models.investigation import Investigation
from app.services.mitre_mapper import load_mitre_techniques

SEVERITIES = ("Critical", "High", "Medium", "Low")


def _safe_json(value: str | None) -> list[Any]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except (TypeError, ValueError, json.JSONDecodeError):
        return []


def _severity_counts(items: list[Any]) -> Counter[str]:
    counts: Counter[str] = Counter()
    for item in items:
        value = str(getattr(item, "severity", "Low")).title()
        counts[value if value in SEVERITIES else "Low"] += 1
    return counts


def _trend(items: list[Any], predicate=lambda _: True) -> list[dict[str, Any]]:
    today = datetime.now(timezone.utc).date()
    days = [today - timedelta(days=offset) for offset in range(6, -1, -1)]
    counts = Counter(
        item.created_at.date()
        for item in items
        if item.created_at and predicate(item) and item.created_at.date() in days
    )
    return [{"date": day.isoformat(), "value": counts[day]} for day in days]


def _mitre_catalog() -> dict[str, str]:
    return {
        technique["technique_id"]: technique["name"]
        for technique in load_mitre_techniques()
    }


def get_severity_distribution(db: Session) -> list[dict[str, Any]]:
    counts = _severity_counts(db.query(Investigation).all())
    return [{"label": severity, "value": counts[severity]} for severity in SEVERITIES]


def get_top_mitre_techniques(db: Session) -> list[dict[str, Any]]:
    counts: Counter[str] = Counter()
    catalog = _mitre_catalog()
    for investigation in db.query(Investigation).all():
        for mapping in _safe_json(investigation.mitre_mappings_json):
            technique_id = mapping.get("technique_id") if isinstance(mapping, dict) else str(mapping)
            if technique_id:
                counts[technique_id] += 1
    for hunt in db.query(HuntingResult).all():
        for mapping in _safe_json(hunt.mitre_mappings_json):
            technique_id = mapping.get("technique_id") if isinstance(mapping, dict) else str(mapping)
            if technique_id:
                counts[technique_id] += 1
    return [
        {"technique_id": technique_id, "name": catalog.get(technique_id, technique_id), "count": count}
        for technique_id, count in counts.most_common(5)
    ]


def get_recent_activity(db: Session) -> list[dict[str, Any]]:
    activity: list[dict[str, Any]] = []
    for item in db.query(Investigation).order_by(Investigation.created_at.desc()).limit(6):
        activity.append({
            "id": f"investigation-{item.id}", "activity_type": "Investigation",
            "title": item.title, "detail": f"Risk {item.risk_score}/100 · {item.event_type}",
            "severity": item.severity, "created_at": item.created_at,
        })
    for item in db.query(DetectionRule).order_by(DetectionRule.created_at.desc()).limit(6):
        activity.append({
            "id": f"detection-{item.id}", "activity_type": "Detection Rule",
            "title": item.title, "detail": "Sigma and YARA package generated",
            "severity": item.severity, "created_at": item.created_at,
        })
    for item in db.query(HuntingResult).order_by(HuntingResult.created_at.desc()).limit(6):
        activity.append({
            "id": f"hunt-{item.id}", "activity_type": "Threat Hunt",
            "title": item.hunt_name, "detail": f"Risk {item.risk_score}/100 · {item.hunt_type}",
            "severity": item.severity, "created_at": item.created_at,
        })
    return sorted(activity, key=lambda item: item["created_at"], reverse=True)[:10]


def get_detection_statistics(db: Session) -> dict[str, Any]:
    rules = db.query(DetectionRule).all()
    counts = _severity_counts(rules)
    return {
        "total": len(rules),
        "severity_distribution": [{"label": value, "value": counts[value]} for value in SEVERITIES],
        "trend": _trend(rules),
    }


def _threat_intel_records(db: Session) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    investigations = db.query(Investigation).order_by(Investigation.created_at.desc()).all()
    for investigation in investigations:
        for intel in _safe_json(investigation.threat_intel_json):
            if not isinstance(intel, dict):
                continue
            records.append({
                **intel,
                "investigation_title": investigation.title,
                "created_at": investigation.created_at,
            })
    return records


def get_threat_intel_statistics(db: Session) -> dict[str, Any]:
    records = _threat_intel_records(db)
    categories = Counter(str(item.get("type", "unknown")).upper() for item in records)
    tags = Counter(str(tag) for item in records for tag in item.get("tags", []))
    high_risk = sum(
        1 for item in records
        if int(item.get("risk_score", 0)) >= 70
        or str(item.get("reputation", "")).lower() in {"high risk", "malicious", "critical"}
    )
    return {
        "total_enrichments": len(records),
        "high_risk_iocs": high_risk,
        "categories": [{"label": key, "value": value} for key, value in categories.most_common()],
        "common_tags": [{"label": key, "value": value} for key, value in tags.most_common(5)],
    }


def get_hunting_statistics(db: Session) -> dict[str, Any]:
    hunts = db.query(HuntingResult).all()
    average = round(sum(item.risk_score for item in hunts) / len(hunts)) if hunts else 0
    return {
        "total": len(hunts),
        "high_risk_hunts": sum(item.risk_score >= 70 for item in hunts),
        "average_risk_score": average,
        "trend": _trend(hunts),
    }


def get_security_score(db: Session) -> int:
    investigations = db.query(Investigation).all()
    alerts = _severity_counts(investigations)
    intel = get_threat_intel_statistics(db)
    hunts = get_hunting_statistics(db)
    detection_count = db.query(DetectionRule).count()
    score = 85
    score -= min(alerts["Critical"] * 3, 21)
    score -= min(alerts["High"], 10)
    score -= min(intel["high_risk_iocs"], 10)
    score -= min(hunts["high_risk_hunts"] * 2, 10)
    score += min(detection_count, 10)
    return max(0, min(100, score))


def get_dashboard_summary(db: Session) -> dict[str, Any]:
    investigations = db.query(Investigation).order_by(Investigation.created_at.desc()).all()
    detections = db.query(DetectionRule).order_by(DetectionRule.created_at.desc()).all()
    hunts = db.query(HuntingResult).order_by(HuntingResult.created_at.desc()).all()
    severity = _severity_counts(investigations)
    threat_intel = get_threat_intel_statistics(db)
    detection_stats = get_detection_statistics(db)
    hunting_stats = get_hunting_statistics(db)
    event_types = Counter(item.event_type.replace("_", " ").title() for item in investigations)
    recent_intel = _threat_intel_records(db)[:8]

    return {
        "total_alerts": len(investigations),
        "critical_alerts": severity["Critical"],
        "high_alerts": severity["High"],
        "medium_alerts": severity["Medium"],
        "low_alerts": severity["Low"],
        "total_detection_rules": len(detections),
        "total_hunts": len(hunts),
        "high_risk_iocs": threat_intel["high_risk_iocs"],
        "average_risk_score": round(sum(item.risk_score for item in investigations) / len(investigations)) if investigations else 0,
        "security_score": get_security_score(db),
        "severity_distribution": get_severity_distribution(db),
        "top_mitre": get_top_mitre_techniques(db),
        "recent_activity": get_recent_activity(db),
        "detection_statistics": detection_stats,
        "threat_intel_statistics": threat_intel,
        "hunting_statistics": hunting_stats,
        "common_alert_types": [{"label": key, "value": value} for key, value in event_types.most_common(5)],
        "critical_alert_trend": _trend(investigations, lambda item: item.severity.title() == "Critical"),
        "latest_investigations": [
            {"id": item.id, "title": item.title, "event_type": item.event_type, "severity": item.severity,
             "risk_score": item.risk_score, "created_at": item.created_at}
            for item in investigations[:5]
        ],
        "latest_detection_rules": [
            {"id": item.id, "title": item.title, "severity": item.severity,
             "mitre_ids": _safe_json(item.mitre_ids_json), "created_at": item.created_at}
            for item in detections[:5]
        ],
        "latest_hunts": [
            {"id": item.id, "hunt_name": item.hunt_name, "hunt_type": item.hunt_type,
             "severity": item.severity, "risk_score": item.risk_score, "created_at": item.created_at}
            for item in hunts[:5]
        ],
        "recent_threat_intel": [
            {"indicator": str(item.get("indicator", "Unknown")), "indicator_type": str(item.get("type", "unknown")),
             "reputation": str(item.get("reputation", "Unknown")), "risk_score": int(item.get("risk_score", 0)),
             "tags": [str(tag) for tag in item.get("tags", [])], "investigation_title": item["investigation_title"],
             "created_at": item["created_at"]}
            for item in recent_intel
        ],
    }


def _metric_lines(items: list[dict[str, Any]], empty: str = "No data recorded.") -> str:
    return "\n".join(f"- **{item['label']}**: {item['value']}" for item in items) or f"- {empty}"


def generate_executive_report(db: Session) -> tuple[str, datetime]:
    overview = get_dashboard_summary(db)
    generated_at = datetime.now(timezone.utc)
    top_risks = []
    if overview["critical_alerts"]:
        top_risks.append(f"{overview['critical_alerts']} critical alert(s) require immediate review.")
    if overview["high_risk_iocs"]:
        top_risks.append(f"{overview['high_risk_iocs']} high-risk indicator enrichment(s) were observed.")
    if overview["hunting_statistics"]["high_risk_hunts"]:
        top_risks.append(f"{overview['hunting_statistics']['high_risk_hunts']} threat hunt(s) scored 70 or higher.")
    if not top_risks:
        top_risks.append("No critical risk concentration is present in the current local dataset.")

    mitre_lines = "\n".join(
        f"- **{item['technique_id']} {item['name']}**: {item['count']} mapping(s)"
        for item in overview["top_mitre"]
    ) or "- No MITRE mappings recorded."
    risk_lines = "\n".join(f"- {risk}" for risk in top_risks)
    report = f"""# CyberGuard AI Executive Security Report

_Generated: {generated_at.strftime('%Y-%m-%d %H:%M:%S UTC')}_

## Executive Summary

CyberGuard AI currently reports a security score of **{overview['security_score']}/100** across **{overview['total_alerts']} alerts**, **{overview['total_hunts']} threat hunts**, and **{overview['total_detection_rules']} detection rules**. The average investigation risk score is **{overview['average_risk_score']}/100**.

## Alert Statistics

{_metric_lines(overview['severity_distribution'])}

## MITRE Technique Distribution

{mitre_lines}

## Threat Intelligence Summary

- Total enrichments: **{overview['threat_intel_statistics']['total_enrichments']}**
- High-risk IOCs: **{overview['high_risk_iocs']}**
- Common tags: {', '.join(item['label'] for item in overview['threat_intel_statistics']['common_tags']) or 'None recorded'}

## Detection Engineering Summary

- Generated rules: **{overview['total_detection_rules']}**
- Rules generated in the last 7 days: **{sum(item['value'] for item in overview['detection_statistics']['trend'])}**

## Threat Hunting Summary

- Completed hunts: **{overview['total_hunts']}**
- High-risk hunts: **{overview['hunting_statistics']['high_risk_hunts']}**
- Average hunt risk: **{overview['hunting_statistics']['average_risk_score']}/100**

## Top Risks

{risk_lines}

## Recommendations

- Prioritize critical alerts and high-risk IOC investigations for analyst review.
- Validate that high-frequency MITRE techniques have corresponding Sigma or YARA coverage.
- Convert repeatable hunt findings into detection rules and document expected false positives.
- Review privileged-account activity and enforce MFA for exposed authentication paths.
- Refresh local threat intelligence datasets and repeat hunts against newly enriched indicators.
"""
    return report, generated_at

