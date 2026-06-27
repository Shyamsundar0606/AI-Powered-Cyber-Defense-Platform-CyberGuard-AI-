import re
from collections import Counter

from app.schemas.hunting import HuntMatch, HuntQueryResponse, Severity, TimelineItem
from app.services.mitre_mapper import enrich_technique_mapping

TIMESTAMP_PATTERN = re.compile(
    r"(?P<timestamp>\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:Z)?)"
)

HUNT_RULES = {
    "authentication": [
        ("failed login", "T1110", "High"),
        ("invalid password", "T1110", "High"),
        ("password spraying", "T1110", "High"),
        ("admin", "T1078", "Medium"),
        ("successful login", "T1078", "Medium"),
    ],
    "powershell": [
        ("powershell", "T1059", "High"),
        ("encodedcommand", "T1059", "Critical"),
        ("downloadstring", "T1105", "Critical"),
        ("invoke-expression", "T1059", "Critical"),
        ("frombase64string", "T1059", "Critical"),
    ],
    "network": [
        ("port scan", "T1082", "High"),
        ("connection refused", "T1082", "Medium"),
        ("unusual outbound", "T1041", "High"),
        ("data transfer", "T1041", "High"),
        ("exfiltration", "T1041", "Critical"),
    ],
    "credential": [
        ("mimikatz", "T1003", "Critical"),
        ("lsass", "T1003", "Critical"),
        ("credential dump", "T1003", "Critical"),
        ("hashdump", "T1003", "Critical"),
    ],
}

GENERIC_RULES = [
    rule for rules in HUNT_RULES.values() for rule in rules
]


def parse_log_lines(log_content: str) -> list[dict]:
    events = []
    for index, line in enumerate(log_content.splitlines(), start=1):
        clean_line = line.strip()
        if not clean_line:
            continue
        match = TIMESTAMP_PATTERN.search(clean_line)
        events.append(
            {
                "line_number": index,
                "line": clean_line,
                "time": match.group("timestamp") if match else f"Event {len(events) + 1}",
            }
        )
    return events


def hunt_patterns(log_content: str, query: str, hunt_type: str = "generic") -> list[HuntMatch]:
    events = parse_log_lines(log_content)
    query_terms = [term.lower() for term in re.findall(r"[A-Za-z0-9_.:-]+", query) if len(term) > 2]
    rules = HUNT_RULES.get(hunt_type, GENERIC_RULES)
    if hunt_type == "generic":
        rules = GENERIC_RULES

    matches: list[HuntMatch] = []
    source_ips = _extract_source_ips(log_content)

    for event in events:
        text = event["line"].lower()
        matched_patterns = []
        mitre_ids = []
        severity: Severity = "Low"

        for pattern, technique_id, rule_severity in rules:
            if pattern in text:
                matched_patterns.append(pattern)
                mitre_ids.append(technique_id)
                severity = _max_severity(severity, rule_severity)

        for term in query_terms:
            if term in text and term not in matched_patterns:
                matched_patterns.append(term)

        if hunt_type == "authentication" and len(source_ips) >= 3 and any(keyword in text for keyword in ["failed login", "invalid password"]):
            matched_patterns.append("multiple source IPs")
            mitre_ids.append("T1110")
            severity = _max_severity(severity, "High")

        if matched_patterns:
            matches.append(
                HuntMatch(
                    line_number=event["line_number"],
                    line=event["line"],
                    matched_patterns=sorted(set(matched_patterns)),
                    severity=severity,
                    mitre_technique_ids=sorted(set(mitre_ids)),
                )
            )

    return matches


def build_attack_timeline(events: list[dict]) -> list[TimelineItem]:
    timeline = []
    for index, event in enumerate(events, start=1):
        matched_patterns = event.get("matched_patterns", [])
        mitre_ids = event.get("mitre_technique_ids", [])
        timeline.append(
            TimelineItem(
                time=event.get("time", f"Event {index}"),
                event=event.get("line", ""),
                matched_pattern=matched_patterns[0] if matched_patterns else "query match",
                severity=event.get("severity", "Low"),
                mitre_technique=mitre_ids[0] if mitre_ids else "Unmapped",
            )
        )
    return timeline


def calculate_hunt_risk_score(matches: list[HuntMatch]) -> int:
    if not matches:
        return 10

    score = min(100, 20 + len(matches) * 10)
    severity_bonus = {"Low": 0, "Medium": 10, "High": 20, "Critical": 35}
    score += max(severity_bonus[match.severity] for match in matches)

    pattern_counts = Counter(pattern for match in matches for pattern in match.matched_patterns)
    if any(count >= 3 for count in pattern_counts.values()):
        score += 15
    if len({pattern for match in matches for pattern in match.matched_patterns}) >= 4:
        score += 10
    return min(score, 100)


def generate_hunt_summary(matches: list[HuntMatch], timeline: list[TimelineItem]) -> str:
    if not matches:
        return "No high-confidence suspicious activity matched the hunt query."
    mapped = sorted({technique_id for match in matches for technique_id in match.mitre_technique_ids})
    return (
        f"Threat hunt found {len(matches)} matching log line(s) and built a {len(timeline)} event attack timeline. "
        f"Observed MITRE technique coverage: {', '.join(mapped) if mapped else 'Unmapped'}."
    )


def run_threat_hunt(hunt_name: str, log_content: str, query: str, hunt_type: str) -> HuntQueryResponse:
    matches = hunt_patterns(log_content, query, hunt_type)
    parsed_events = parse_log_lines(log_content)
    events_by_line = {event["line_number"]: event for event in parsed_events}
    timeline_events = []

    for match in matches:
        event = events_by_line.get(match.line_number, {})
        timeline_events.append(
            {
                **event,
                "matched_patterns": match.matched_patterns,
                "severity": match.severity,
                "mitre_technique_ids": match.mitre_technique_ids,
            }
        )

    timeline = build_attack_timeline(timeline_events)
    risk_score = calculate_hunt_risk_score(matches)
    severity = _severity_from_score(risk_score, matches)
    mitre_ids = sorted({technique_id for match in matches for technique_id in match.mitre_technique_ids})
    context = f"{hunt_type} {query} {log_content}"

    return HuntQueryResponse(
        hunt_name=hunt_name,
        matches=matches,
        timeline=timeline,
        risk_score=risk_score,
        severity=severity,
        summary=generate_hunt_summary(matches, timeline),
        suspicious_patterns=sorted({pattern for match in matches for pattern in match.matched_patterns}),
        mitre_mappings=enrich_technique_mapping(mitre_ids, context),
        recommended_actions=_recommended_actions(hunt_type, severity),
    )


def _extract_source_ips(log_content: str) -> set[str]:
    return set(re.findall(r"\b(?:from|src=|source=)\s*(\d{1,3}(?:\.\d{1,3}){3})\b", log_content.lower()))


def _severity_from_score(score: int, matches: list[HuntMatch]) -> Severity:
    if any(match.severity == "Critical" for match in matches) or score >= 90:
        return "Critical"
    if score >= 70:
        return "High"
    if score >= 40:
        return "Medium"
    return "Low"


def _max_severity(current: Severity, candidate: str) -> Severity:
    order = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}
    return candidate if order[candidate] > order[current] else current


def _recommended_actions(hunt_type: str, severity: Severity) -> list[str]:
    actions = {
        "authentication": [
            "Review authentication logs for repeated failures and successful login after failures.",
            "Challenge or reset impacted privileged accounts.",
            "Block suspicious source IPs if activity is unauthorized.",
        ],
        "powershell": [
            "Collect PowerShell script block logs and process creation telemetry.",
            "Validate whether encoded or download cradle commands were approved.",
            "Isolate the endpoint if command execution is suspicious.",
        ],
        "network": [
            "Review firewall, proxy, and NetFlow records around the timeline.",
            "Identify unusual outbound destinations and transferred volume.",
            "Contain hosts involved in suspected exfiltration.",
        ],
        "credential": [
            "Collect endpoint telemetry for credential access tooling.",
            "Rotate credentials for affected users and privileged accounts.",
            "Review LSASS access and credential dumping indicators.",
        ],
    }
    base_actions = actions.get(hunt_type, ["Review matched events and expand the hunt across adjacent logs."])
    if severity in {"High", "Critical"}:
        return base_actions + ["Open an incident ticket and preserve relevant evidence."]
    return base_actions
