from typing import Literal

from pydantic import BaseModel, Field

IndicatorType = Literal["ip", "domain", "hash", "cve"]


class ThreatIntelRequest(BaseModel):
    indicator: str = Field(..., min_length=2, max_length=255)
    type: IndicatorType


class ThreatIntelResult(BaseModel):
    indicator: str
    type: IndicatorType
    risk_score: int = Field(..., ge=0, le=100)
    reputation: str
    tags: list[str]
    recommendations: list[str]
    severity: str | None = None
    cvss: float | None = None
    description: str | None = None
    mitigation: list[str] = []
