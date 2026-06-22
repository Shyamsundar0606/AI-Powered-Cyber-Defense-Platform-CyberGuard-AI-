from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.threat_intel import ThreatIntelRequest, ThreatIntelResult
from app.services.threat_intel import enrich_cve, enrich_indicator, enrich_ip

router = APIRouter(prefix="/api/threat-intel", tags=["threat intelligence"])


@router.post("/enrich", response_model=ThreatIntelResult)
def enrich_threat_indicator(
    payload: ThreatIntelRequest,
    current_user: User = Depends(get_current_user),
) -> ThreatIntelResult:
    return enrich_indicator(payload.indicator, payload.type)


@router.get("/ip/{ip}", response_model=ThreatIntelResult)
def read_ip_enrichment(
    ip: str,
    current_user: User = Depends(get_current_user),
) -> ThreatIntelResult:
    return enrich_ip(ip)


@router.get("/cve/{cve}", response_model=ThreatIntelResult)
def read_cve_enrichment(
    cve: str,
    current_user: User = Depends(get_current_user),
) -> ThreatIntelResult:
    return enrich_cve(cve)
