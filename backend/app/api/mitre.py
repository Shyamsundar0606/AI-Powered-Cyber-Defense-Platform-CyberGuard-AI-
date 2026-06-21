from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.soc import MitreLogMappingRequest, MitreTechnique
from app.services.mitre_mapper import get_technique_by_id, load_mitre_techniques, map_log_to_techniques

router = APIRouter(prefix="/api/mitre", tags=["mitre"])


@router.get("/techniques", response_model=list[MitreTechnique])
def list_mitre_techniques(current_user: User = Depends(get_current_user)) -> list[MitreTechnique]:
    return [MitreTechnique(**technique, matched_keywords=[]) for technique in load_mitre_techniques()]


@router.get("/techniques/{technique_id}", response_model=MitreTechnique)
def read_mitre_technique(
    technique_id: str,
    current_user: User = Depends(get_current_user),
) -> MitreTechnique:
    technique = get_technique_by_id(technique_id)
    if technique is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MITRE technique was not found.",
        )
    return MitreTechnique(**technique, matched_keywords=[])


@router.post("/map-log", response_model=list[MitreTechnique])
def map_log_to_mitre(
    payload: MitreLogMappingRequest,
    current_user: User = Depends(get_current_user),
) -> list[MitreTechnique]:
    return map_log_to_techniques(payload.log_content, payload.event_type)
