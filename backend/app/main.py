from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="CyberGuard AI API",
    description="AI-powered cyber defense platform backend.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": "cyberguard-ai-backend"}


@app.get("/api/status", tags=["system"])
def api_status() -> dict[str, str]:
    return {
        "project": "CyberGuard AI",
        "phase": "Phase 1 - Project Setup",
        "backend": "online",
        "ai_mode": "rule-based-ready",
    }
