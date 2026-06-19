from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, protected
from app.core.config import get_settings
from app.db.database import Base, engine
from app.models import user as user_model

settings = get_settings()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CyberGuard AI API",
    description="AI-powered cyber defense platform backend.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(protected.router)


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": "cyberguard-ai-backend"}


@app.get("/api/status", tags=["system"])
def api_status() -> dict[str, str]:
    return {
        "project": "CyberGuard AI",
        "phase": "Phase 2 - JWT Authentication",
        "backend": "online",
        "auth": "jwt-enabled",
        "database": "sqlite",
    }
