import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.detection_rule import DetectionRule
from app.models.user import User
from app.schemas.detection import DetectionRuleHistory, DetectionRuleRequest, DetectionRuleResponse
from app.services.detection_engineering import generate_detection_package

router = APIRouter(prefix="/api/detection", tags=["detection engineering"])


@router.post("/generate", response_model=DetectionRuleResponse)
def generate_detection_rule(
    payload: DetectionRuleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DetectionRuleResponse:
    result = generate_detection_package(payload.model_dump())
    detection_rule = DetectionRule(
        title=payload.title,
        sigma_rule=result.sigma_rule,
        yara_rule=result.yara_rule,
        severity=result.severity,
        mitre_ids_json=json.dumps(payload.mitre_technique_ids),
    )
    db.add(detection_rule)
    db.commit()
    return result


@router.get("/history", response_model=list[DetectionRuleHistory])
def detection_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DetectionRule]:
    return db.query(DetectionRule).order_by(DetectionRule.created_at.desc()).limit(10).all()
