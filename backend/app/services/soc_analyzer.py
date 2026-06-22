from app.schemas.soc import AlertAnalysisRequest, AlertAnalysisResponse, MitreTechnique
from app.services.mitre_mapper import enrich_technique_mapping, map_log_to_techniques
from app.services.threat_intel import enrich_ip


def analyze_alert(payload: AlertAnalysisRequest) -> AlertAnalysisResponse:
    text = " ".join(
        [
            payload.title,
            payload.log_content,
            payload.source_ip,
            payload.destination_ip,
            payload.username,
            payload.event_type,
        ]
    ).lower()

    indicators: list[str] = []
    mitre_ids: set[str] = set()
    actions: set[str] = set()
    risk_score = 10

    def add_finding(
        indicator: str,
        score: int,
        techniques: list[str],
        recommended_actions: list[str],
    ) -> None:
        nonlocal risk_score
        indicators.append(indicator)
        risk_score += score
        mitre_ids.update(techniques)
        actions.update(recommended_actions)

    if _contains_any(text, ["multiple failed", "failed login", "login failed", "failed authentication"]):
        add_finding(
            "Multiple failed login attempts detected.",
            55,
            ["T1110"],
            [
                "Review authentication logs for repeated failures from the same source.",
                "Temporarily lock or challenge the targeted account if failures continue.",
            ],
        )

    if _contains_any(text, ["brute force", "bruteforce", "credential stuffing"]):
        add_finding(
            "Brute force keywords detected.",
            80,
            ["T1110"],
            [
                "Block the source IP at the firewall or identity provider.",
                "Force password reset for targeted accounts.",
            ],
        )

    if payload.username.lower() in {"admin", "administrator", "root", "domain admin"} or _contains_any(
        text, ["privileged account", "domain admin", "administrator login"]
    ):
        add_finding(
            "Privileged account activity observed.",
            25,
            ["T1078"],
            [
                "Validate whether the privileged login was expected.",
                "Review recent privileged account activity and MFA status.",
            ],
        )

    if _contains_any(text, ["password spray", "password spraying", "spray attack"]):
        add_finding(
            "Password spraying behavior detected.",
            55,
            ["T1110"],
            [
                "Identify all accounts targeted by the spraying attempt.",
                "Enable conditional access or rate limiting for authentication.",
            ],
        )

    if _contains_any(text, ["port scan", "scan detected", "nmap", "masscan"]):
        add_finding(
            "Port scan activity detected.",
            55,
            [],
            [
                "Inspect source host for reconnaissance tooling.",
                "Review firewall logs for additional scanned destinations.",
            ],
        )

    if _contains_any(text, ["suspicious outbound", "unusual outbound", "beacon", "c2", "command and control"]):
        add_finding(
            "Suspicious outbound traffic detected.",
            55,
            ["T1041"],
            [
                "Review outbound connections and DNS activity for the host.",
                "Isolate the host if outbound command-and-control traffic is confirmed.",
            ],
        )

    if _contains_any(text, ["data exfiltration", "exfiltration", "large upload", "sensitive data transfer"]):
        add_finding(
            "Data exfiltration keyword detected.",
            80,
            ["T1041"],
            [
                "Block the destination and preserve network flow evidence.",
                "Identify files or records accessed before the transfer.",
            ],
        )

    if _contains_any(text, ["encodedcommand", "encoded command", "-enc ", "frombase64string", "powershell -e"]):
        add_finding(
            "PowerShell encoded command detected.",
            80,
            ["T1059"],
            [
                "Capture the command line and decode the encoded payload.",
                "Check endpoint telemetry for spawned processes and persistence.",
            ],
        )

    if _contains_any(text, ["process injection", "inject into", "create remote thread", "dll injection"]):
        add_finding(
            "Process injection behavior detected.",
            80,
            ["T1055"],
            [
                "Collect process tree and memory evidence from the affected host.",
                "Quarantine the endpoint while validating malicious code execution.",
            ],
        )

    if _contains_any(text, [".exe", "suspicious executable", "unknown executable", "temp\\", "appdata\\"]):
        add_finding(
            "Suspicious executable activity detected.",
            55,
            ["T1059"],
            [
                "Hash the executable and compare against known-good software inventory.",
                "Review file origin, signer, parent process, and persistence artifacts.",
            ],
        )

    risk_score = min(risk_score, 100)
    severity = _severity_from_score(risk_score)

    if not indicators:
        indicators.append("No high-confidence suspicious indicators matched the deterministic rules.")
        actions.add("Continue monitoring and enrich the alert with endpoint, identity, and network context.")

    mapped_from_rules = enrich_technique_mapping(
        list(mitre_ids),
        f"{payload.title} {payload.log_content} {payload.username} {payload.event_type}",
    )
    mapped_from_keywords = map_log_to_techniques(
        f"{payload.title} {payload.log_content} {payload.username}",
        payload.event_type,
    )
    techniques = _merge_techniques(mapped_from_rules + mapped_from_keywords)
    threat_intel_results = [
        enrich_ip(payload.source_ip),
        enrich_ip(payload.destination_ip),
    ]

    summary = (
        f"{severity} severity alert for {payload.event_type} activity involving "
        f"{payload.source_ip} -> {payload.destination_ip} and user {payload.username}. "
        f"{len(indicators)} indicator(s) were identified."
    )

    incident_report = _build_incident_report(payload, severity, risk_score, indicators, techniques, sorted(actions))

    return AlertAnalysisResponse(
        severity=severity,
        risk_score=risk_score,
        summary=summary,
        suspicious_indicators=indicators,
        mitre_techniques=techniques,
        threat_intel_results=threat_intel_results,
        recommended_actions=sorted(actions),
        incident_report=incident_report,
    )


def _contains_any(text: str, keywords: list[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def _severity_from_score(score: int) -> str:
    if score >= 85:
        return "Critical"
    if score >= 60:
        return "High"
    if score >= 35:
        return "Medium"
    return "Low"


def _build_incident_report(
    payload: AlertAnalysisRequest,
    severity: str,
    risk_score: int,
    indicators: list[str],
    techniques: list[MitreTechnique],
    actions: list[str],
) -> str:
    technique_text = ", ".join(f"{tech.technique_id} {tech.name}" for tech in techniques) or "No direct MITRE mapping"
    indicator_text = "; ".join(indicators)
    action_text = "; ".join(actions)
    return (
        f"Incident Report: {payload.title}\n"
        f"Severity: {severity} | Risk Score: {risk_score}/100\n"
        f"Scope: source {payload.source_ip} to destination {payload.destination_ip}; "
        f"user {payload.username}; event type {payload.event_type}.\n"
        f"Indicators: {indicator_text}\n"
        f"MITRE ATT&CK: {technique_text}\n"
        f"Recommended Actions: {action_text}"
    )


def _merge_techniques(techniques: list[MitreTechnique]) -> list[MitreTechnique]:
    merged: dict[str, MitreTechnique] = {}
    for technique in techniques:
        existing = merged.get(technique.technique_id)
        if existing is None:
            merged[technique.technique_id] = technique
            continue
        existing.matched_keywords = sorted(set(existing.matched_keywords + technique.matched_keywords))
    return [merged[technique_id] for technique_id in sorted(merged)]
