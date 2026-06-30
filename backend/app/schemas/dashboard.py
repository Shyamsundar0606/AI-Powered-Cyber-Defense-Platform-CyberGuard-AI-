from datetime import datetime

from pydantic import BaseModel


class MetricItem(BaseModel):
    label: str
    value: int


class TrendItem(BaseModel):
    date: str
    value: int


class MitreMetric(BaseModel):
    technique_id: str
    name: str
    count: int


class ActivityItem(BaseModel):
    id: str
    activity_type: str
    title: str
    detail: str
    severity: str
    created_at: datetime


class InvestigationSummary(BaseModel):
    id: int
    title: str
    event_type: str
    severity: str
    risk_score: int
    created_at: datetime


class DetectionSummary(BaseModel):
    id: int
    title: str
    severity: str
    mitre_ids: list[str]
    created_at: datetime


class HuntSummary(BaseModel):
    id: int
    hunt_name: str
    hunt_type: str
    severity: str
    risk_score: int
    created_at: datetime


class ThreatIntelSummary(BaseModel):
    indicator: str
    indicator_type: str
    reputation: str
    risk_score: int
    tags: list[str]
    investigation_title: str
    created_at: datetime


class DetectionStatistics(BaseModel):
    total: int
    severity_distribution: list[MetricItem]
    trend: list[TrendItem]


class ThreatIntelStatistics(BaseModel):
    total_enrichments: int
    high_risk_iocs: int
    categories: list[MetricItem]
    common_tags: list[MetricItem]


class HuntingStatistics(BaseModel):
    total: int
    high_risk_hunts: int
    average_risk_score: int
    trend: list[TrendItem]


class DashboardOverview(BaseModel):
    total_alerts: int
    critical_alerts: int
    high_alerts: int
    medium_alerts: int
    low_alerts: int
    total_detection_rules: int
    total_hunts: int
    high_risk_iocs: int
    average_risk_score: int
    security_score: int
    severity_distribution: list[MetricItem]
    top_mitre: list[MitreMetric]
    recent_activity: list[ActivityItem]
    detection_statistics: DetectionStatistics
    threat_intel_statistics: ThreatIntelStatistics
    hunting_statistics: HuntingStatistics
    common_alert_types: list[MetricItem]
    critical_alert_trend: list[TrendItem]
    latest_investigations: list[InvestigationSummary]
    latest_detection_rules: list[DetectionSummary]
    latest_hunts: list[HuntSummary]
    recent_threat_intel: list[ThreatIntelSummary]


class ExecutiveReportResponse(BaseModel):
    report_markdown: str
    generated_at: datetime

