from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.soc import MitreTechnique

HuntType = Literal["authentication", "powershell", "network", "credential", "generic"]
Severity = Literal["Low", "Medium", "High", "Critical"]


class HuntQueryRequest(BaseModel):
    hunt_name: str = Field(..., min_length=3, max_length=160)
    log_content: str = Field(..., min_length=5, max_length=20000)
    query: str = Field(..., min_length=2, max_length=600)
    hunt_type: HuntType = "generic"


class HuntMatch(BaseModel):
    line_number: int
    line: str
    matched_patterns: list[str]
    severity: Severity
    mitre_technique_ids: list[str]


class TimelineItem(BaseModel):
    time: str
    event: str
    matched_pattern: str
    severity: Severity
    mitre_technique: str


class HuntQueryResponse(BaseModel):
    hunt_name: str
    matches: list[HuntMatch]
    timeline: list[TimelineItem]
    risk_score: int
    severity: Severity
    summary: str
    suspicious_patterns: list[str]
    mitre_mappings: list[MitreTechnique]
    recommended_actions: list[str]


class HuntingResultRead(BaseModel):
    id: int
    hunt_name: str
    query: str
    hunt_type: str
    risk_score: int
    severity: str
    summary: str
    matches_json: str
    timeline_json: str
    mitre_mappings_json: str
    created_at: datetime

    model_config = {"from_attributes": True}
