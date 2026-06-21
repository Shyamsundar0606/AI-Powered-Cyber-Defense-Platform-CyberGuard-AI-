from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Severity = Literal["Low", "Medium", "High", "Critical"]


class AlertAnalysisRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    log_content: str = Field(..., min_length=5)
    source_ip: str = Field(..., min_length=2, max_length=64)
    destination_ip: str = Field(..., min_length=2, max_length=64)
    username: str = Field(..., min_length=1, max_length=120)
    event_type: str = Field(..., min_length=2, max_length=80)


class MitreTechnique(BaseModel):
    technique_id: str
    name: str
    tactic: str
    description: str
    common_log_sources: list[str]
    detection_ideas: list[str]
    mitigation: list[str]
    example_keywords: list[str]
    matched_keywords: list[str] = []


class AlertAnalysisResponse(BaseModel):
    severity: Severity
    risk_score: int = Field(..., ge=0, le=100)
    summary: str
    suspicious_indicators: list[str]
    mitre_techniques: list[MitreTechnique]
    recommended_actions: list[str]
    incident_report: str


class MitreLogMappingRequest(BaseModel):
    log_content: str = Field(..., min_length=5)
    event_type: str = Field(default="", max_length=80)


class InvestigationRead(BaseModel):
    id: int
    title: str
    source_ip: str
    destination_ip: str
    username: str
    event_type: str
    severity: Severity
    risk_score: int
    summary: str
    mitre_mappings_json: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
