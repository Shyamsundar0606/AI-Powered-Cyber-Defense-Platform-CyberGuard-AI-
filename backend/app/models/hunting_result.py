from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class HuntingResult(Base):
    __tablename__ = "hunting_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    hunt_name: Mapped[str] = mapped_column(String(255), nullable=False)
    query: Mapped[str] = mapped_column(String(600), nullable=False)
    hunt_type: Mapped[str] = mapped_column(String(40), nullable=False)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    matches_json: Mapped[str] = mapped_column(Text, nullable=False)
    timeline_json: Mapped[str] = mapped_column(Text, nullable=False)
    mitre_mappings_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
