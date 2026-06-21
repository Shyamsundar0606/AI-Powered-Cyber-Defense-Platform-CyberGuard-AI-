import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.investigation import Investigation
from app.models.user import User
from app.schemas.soc import AlertAnalysisRequest, AlertAnalysisResponse, InvestigationRead
from app.services.soc_analyzer import analyze_alert

router = APIRouter(prefix="/api/soc", tags=["soc analyst"])


@router.post("/analyze", response_model=AlertAnalysisResponse)
def analyze_soc_alert(
    payload: AlertAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AlertAnalysisResponse:
    result = analyze_alert(payload)
    investigation = Investigation(
        title=payload.title,
        source_ip=payload.source_ip,
        destination_ip=payload.destination_ip,
        username=payload.username,
        event_type=payload.event_type,
        severity=result.severity,
        risk_score=result.risk_score,
        summary=result.summary,
        mitre_mappings_json=json.dumps(
            [technique.model_dump() for technique in result.mitre_techniques],
            default=str,
        ),
    )
    db.add(investigation)
    db.commit()
    return result


@router.get("/history", response_model=list[InvestigationRead])
def soc_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Investigation]:
    return db.query(Investigation).order_by(Investigation.created_at.desc()).limit(10).all()
