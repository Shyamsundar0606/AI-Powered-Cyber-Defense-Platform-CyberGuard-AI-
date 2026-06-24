from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.soc import MitreTechnique

DetectionSeverity = Literal["Low", "Medium", "High", "Critical"]
LogSource = Literal[
    "windows_security",
    "powershell",
    "sysmon",
    "linux_auth",
    "web_server",
    "cloudtrail",
]


class DetectionRuleRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=160)
    description: str = Field(..., min_length=10, max_length=1200)
    log_source: LogSource
    suspicious_behavior: str = Field(..., min_length=3, max_length=600)
    mitre_technique_ids: list[str] = []


class DetectionRuleResponse(BaseModel):
    sigma_rule: str
    yara_rule: str
    explanation: str
    false_positive_notes: list[str]
    recommended_log_sources: list[str]
    mitre_mappings: list[MitreTechnique]
    severity: DetectionSeverity


class DetectionRuleHistory(BaseModel):
    id: int
    title: str
    sigma_rule: str
    yara_rule: str
    severity: str
    mitre_ids_json: str
    created_at: datetime

    model_config = {"from_attributes": True}
