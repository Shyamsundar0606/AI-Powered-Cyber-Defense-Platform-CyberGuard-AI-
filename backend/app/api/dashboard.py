from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardOverview, ExecutiveReportResponse
from app.services.dashboard import generate_executive_report, get_dashboard_summary

router = APIRouter(prefix="/api/dashboard", tags=["security dashboard"])


@router.get("/overview", response_model=DashboardOverview)
def dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardOverview:
    return DashboardOverview.model_validate(get_dashboard_summary(db))


@router.get("/report", response_model=ExecutiveReportResponse)
def executive_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExecutiveReportResponse:
    report, generated_at = generate_executive_report(db)
    return ExecutiveReportResponse(report_markdown=report, generated_at=generated_at)

