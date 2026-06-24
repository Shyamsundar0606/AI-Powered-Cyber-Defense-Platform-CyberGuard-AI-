from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import auth, detection, mitre, protected, soc, threat_intel
from app.core.config import get_settings
from app.db.database import Base, engine
from app.models import detection_rule as detection_rule_model
from app.models import investigation as investigation_model
from app.models import user as user_model

settings = get_settings()
Base.metadata.create_all(bind=engine)

with engine.begin() as connection:
    if settings.database_url.startswith("sqlite"):
        columns = connection.execute(text("PRAGMA table_info(investigations)")).fetchall()
        column_names = {column[1] for column in columns}
        if "mitre_mappings_json" not in column_names:
            connection.execute(text("ALTER TABLE investigations ADD COLUMN mitre_mappings_json TEXT"))
        if "threat_intel_json" not in column_names:
            connection.execute(text("ALTER TABLE investigations ADD COLUMN threat_intel_json TEXT"))

app = FastAPI(
    title="CyberGuard AI API",
    description="AI-powered cyber defense platform backend.",
    version="0.6.0",
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
app.include_router(soc.router)
app.include_router(mitre.router)
app.include_router(threat_intel.router)
app.include_router(detection.router)


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": "cyberguard-ai-backend"}


@app.get("/api/status", tags=["system"])
def api_status() -> dict[str, str]:
    return {
        "project": "CyberGuard AI",
        "phase": "Phase 6 - Detection Engineering",
        "backend": "online",
        "auth": "jwt-enabled",
        "database": "sqlite",
        "soc_analyzer": "rule-based",
        "mitre_knowledge_base": "local-json",
        "threat_intel": "offline-local",
        "detection_engineering": "sigma-yara-rule-generation",
    }
