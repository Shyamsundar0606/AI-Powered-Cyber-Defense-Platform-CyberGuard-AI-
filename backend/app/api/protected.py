from fastapi import APIRouter, Depends

from app.core.security import get_current_user, require_admin
from app.models.user import User
from app.schemas.auth import AdminDashboard, ProtectedDashboard, UserRead

router = APIRouter(prefix="/api/protected", tags=["protected"])


@router.get("/dashboard", response_model=ProtectedDashboard)
def protected_dashboard(current_user: User = Depends(get_current_user)) -> ProtectedDashboard:
    return ProtectedDashboard(
        message="Authenticated dashboard access granted.",
        user=UserRead.model_validate(current_user),
        modules=["SOC Analyst", "Threat Intel", "MITRE Mapping", "Detection Rules"],
    )


@router.get("/admin", response_model=AdminDashboard)
def admin_dashboard(current_user: User = Depends(require_admin)) -> AdminDashboard:
    return AdminDashboard(
        message="Admin security controls available.",
        user=UserRead.model_validate(current_user),
        controls=["User management", "Role review", "Platform audit"],
    )
