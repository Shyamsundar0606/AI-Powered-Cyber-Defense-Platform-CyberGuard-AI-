import os
from functools import lru_cache


class Settings:
    project_name: str = "CyberGuard AI"
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./cyberguard.db")
    jwt_secret_key: str = os.getenv(
        "JWT_SECRET_KEY",
        "change-this-development-secret-before-production",
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
