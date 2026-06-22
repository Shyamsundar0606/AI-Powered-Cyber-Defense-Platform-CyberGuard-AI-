import hashlib
import ipaddress
import json
import re
from functools import lru_cache
from pathlib import Path

from app.schemas.threat_intel import ThreatIntelResult

DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "threat_intel"

MALICIOUS_HASHES = {
    "44d88612fea8a8f36de82e1278abb02f": {
        "reputation": "High Risk",
        "risk_score": 90,
        "tags": ["eicar_test_file", "known_malicious_hash"],
        "recommendations": ["Quarantine matching files.", "Search endpoints for the hash and review execution history."],
    },
    hashlib.sha256(b"cyberguard-malware-sample").hexdigest(): {
        "reputation": "High Risk",
        "risk_score": 85,
        "tags": ["local_malware_sample", "known_malicious_hash"],
        "recommendations": ["Block the hash in endpoint controls.", "Review file origin and parent process."],
    },
}

SUSPICIOUS_DOMAIN_KEYWORDS = [
    "login",
    "verify",
    "secure",
    "update",
    "download",
    "free",
    "account",
    "password",
    "invoice",
]


@lru_cache
def _load_json(filename: str) -> list[dict]:
    with (DATA_DIR / filename).open("r", encoding="utf-8") as file:
        return json.load(file)


def enrich_ip(ip: str) -> ThreatIntelResult:
    indicator = ip.strip()
    local_match = _find_indicator(_load_json("suspicious_ips.json"), indicator)
    if local_match:
        return ThreatIntelResult(type="ip", **local_match)

    try:
        parsed_ip = ipaddress.ip_address(indicator)
    except ValueError:
        return ThreatIntelResult(
            indicator=indicator,
            type="ip",
            risk_score=70,
            reputation="Invalid Indicator",
            tags=["invalid_ip"],
            recommendations=["Confirm the IP address format before relying on enrichment."],
        )

    if parsed_ip.is_loopback:
        return _ip_result(indicator, 5, "Low Risk", ["loopback"], ["Treat as local host activity unless logs were forged."])
    if parsed_ip.is_private:
        return _ip_result(indicator, 10, "Low Risk", ["private_ip", "internal_asset"], ["Enrich with asset inventory and endpoint telemetry."])
    if parsed_ip.is_reserved or parsed_ip.is_multicast or parsed_ip.is_unspecified:
        return _ip_result(indicator, 25, "Low Risk", ["reserved_range"], ["Validate whether this address should appear in production logs."])
    return _ip_result(indicator, 35, "Low Risk", ["public_ip"], ["Correlate with geolocation, ASN, authentication, and firewall logs."])


def enrich_domain(domain: str) -> ThreatIntelResult:
    indicator = domain.strip().lower()
    local_match = _find_indicator(_load_json("known_domains.json"), indicator)
    if local_match:
        return ThreatIntelResult(type="domain", **local_match)

    labels = indicator.split(".")
    tags: list[str] = []
    recommendations = ["Review DNS, proxy, and endpoint telemetry for domain contact."]
    risk_score = 20

    keyword_hits = [keyword for keyword in SUSPICIOUS_DOMAIN_KEYWORDS if keyword in indicator]
    if keyword_hits:
        tags.extend([f"keyword:{keyword}" for keyword in keyword_hits])
        risk_score += min(35, len(keyword_hits) * 10)
        recommendations.append("Validate whether keyword-heavy domain naming is legitimate.")

    if len(labels[0]) >= 18 or any(char.isdigit() for char in labels[0]):
        tags.append("newly_registered_style")
        risk_score += 20
        recommendations.append("Check registration age and certificate history before allowing traffic.")

    if "-" in labels[0]:
        tags.append("hyphenated_domain")
        risk_score += 10

    risk_score = min(risk_score, 100)
    reputation = _reputation_from_score(risk_score)
    if not tags:
        tags.append("unknown_domain")

    return ThreatIntelResult(
        indicator=indicator,
        type="domain",
        risk_score=risk_score,
        reputation=reputation,
        tags=tags,
        recommendations=recommendations,
    )


def enrich_hash(hash_value: str) -> ThreatIntelResult:
    indicator = hash_value.strip().lower()
    hash_type = _hash_type(indicator)
    if hash_type is None:
        return ThreatIntelResult(
            indicator=indicator,
            type="hash",
            risk_score=65,
            reputation="Invalid Indicator",
            tags=["invalid_hash"],
            recommendations=["Confirm the hash format is MD5, SHA1, or SHA256."],
        )

    if indicator in MALICIOUS_HASHES:
        return ThreatIntelResult(indicator=indicator, type="hash", **MALICIOUS_HASHES[indicator])

    return ThreatIntelResult(
        indicator=indicator,
        type="hash",
        risk_score=30,
        reputation="Low Risk",
        tags=[hash_type, "unknown_hash"],
        recommendations=["Compare against endpoint inventory, malware sandboxes, and allowlists."],
    )


def enrich_cve(cve_id: str) -> ThreatIntelResult:
    indicator = cve_id.strip().upper()
    if not re.fullmatch(r"CVE-\d{4}-\d{4,7}", indicator):
        return ThreatIntelResult(
            indicator=indicator,
            type="cve",
            risk_score=60,
            reputation="Invalid Indicator",
            tags=["invalid_cve"],
            recommendations=["Confirm the CVE format before triage."],
        )

    local_match = next((item for item in _load_json("cve_catalog.json") if item["cve_id"].upper() == indicator), None)
    if local_match:
        risk_score = _risk_from_cvss(float(local_match["cvss"]))
        return ThreatIntelResult(
            indicator=indicator,
            type="cve",
            risk_score=risk_score,
            reputation=_reputation_from_score(risk_score),
            tags=["known_cve", local_match["severity"].lower()],
            recommendations=local_match["mitigation"],
            severity=local_match["severity"],
            cvss=local_match["cvss"],
            description=local_match["description"],
            mitigation=local_match["mitigation"],
        )

    return ThreatIntelResult(
        indicator=indicator,
        type="cve",
        risk_score=40,
        reputation="Medium Risk",
        tags=["unknown_cve"],
        recommendations=["Check NVD, CISA KEV, vendor advisories, and asset exposure."],
    )


def enrich_indicator(indicator: str, indicator_type: str) -> ThreatIntelResult:
    if indicator_type == "ip":
        return enrich_ip(indicator)
    if indicator_type == "domain":
        return enrich_domain(indicator)
    if indicator_type == "hash":
        return enrich_hash(indicator)
    if indicator_type == "cve":
        return enrich_cve(indicator)
    raise ValueError("Unsupported indicator type.")


def _find_indicator(items: list[dict], indicator: str) -> dict | None:
    normalized = indicator.lower()
    return next((item for item in items if item["indicator"].lower() == normalized), None)


def _ip_result(indicator: str, risk_score: int, reputation: str, tags: list[str], recommendations: list[str]) -> ThreatIntelResult:
    return ThreatIntelResult(
        indicator=indicator,
        type="ip",
        risk_score=risk_score,
        reputation=reputation,
        tags=tags,
        recommendations=recommendations,
    )


def _hash_type(value: str) -> str | None:
    if re.fullmatch(r"[a-fA-F0-9]{32}", value):
        return "md5"
    if re.fullmatch(r"[a-fA-F0-9]{40}", value):
        return "sha1"
    if re.fullmatch(r"[a-fA-F0-9]{64}", value):
        return "sha256"
    return None


def _risk_from_cvss(cvss: float) -> int:
    return min(100, max(0, round(cvss * 10)))


def _reputation_from_score(score: int) -> str:
    if score >= 80:
        return "High Risk"
    if score >= 50:
        return "Medium Risk"
    return "Low Risk"
