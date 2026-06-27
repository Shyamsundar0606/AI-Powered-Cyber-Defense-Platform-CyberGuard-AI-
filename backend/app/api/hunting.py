import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.hunting_result import HuntingResult
from app.models.user import User
from app.schemas.hunting import HuntQueryRequest, HuntQueryResponse, HuntingResultRead
from app.services.threat_hunting import run_threat_hunt

router = APIRouter(prefix="/api/hunting", tags=["threat hunting"])


@router.post("/query", response_model=HuntQueryResponse)
def run_hunting_query(
    payload: HuntQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HuntQueryResponse:
    result = run_threat_hunt(
        hunt_name=payload.hunt_name,
        log_content=payload.log_content,
        query=payload.query,
        hunt_type=payload.hunt_type,
    )
    stored_result = HuntingResult(
        hunt_name=payload.hunt_name,
        query=payload.query,
        hunt_type=payload.hunt_type,
        risk_score=result.risk_score,
        severity=result.severity,
        summary=result.summary,
        matches_json=json.dumps([match.model_dump() for match in result.matches], default=str),
        timeline_json=json.dumps([item.model_dump() for item in result.timeline], default=str),
        mitre_mappings_json=json.dumps([item.model_dump() for item in result.mitre_mappings], default=str),
    )
    db.add(stored_result)
    db.commit()
    return result


@router.get("/history", response_model=list[HuntingResultRead])
def hunting_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[HuntingResult]:
    return db.query(HuntingResult).order_by(HuntingResult.created_at.desc()).limit(10).all()
