import { apiRequest } from "./api";

export type MetricItem = { label: string; value: number };
export type TrendItem = { date: string; value: number };
export type MitreMetric = { technique_id: string; name: string; count: number };

export type ActivityItem = {
  id: string;
  activity_type: string;
  title: string;
  detail: string;
  severity: string;
  created_at: string;
};

export type DashboardOverview = {
  total_alerts: number;
  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  low_alerts: number;
  total_detection_rules: number;
  total_hunts: number;
  high_risk_iocs: number;
  average_risk_score: number;
  security_score: number;
  severity_distribution: MetricItem[];
  top_mitre: MitreMetric[];
  recent_activity: ActivityItem[];
  detection_statistics: {
    total: number;
    severity_distribution: MetricItem[];
    trend: TrendItem[];
  };
  threat_intel_statistics: {
    total_enrichments: number;
    high_risk_iocs: number;
    categories: MetricItem[];
    common_tags: MetricItem[];
  };
  hunting_statistics: {
    total: number;
    high_risk_hunts: number;
    average_risk_score: number;
    trend: TrendItem[];
  };
  common_alert_types: MetricItem[];
  critical_alert_trend: TrendItem[];
  latest_investigations: Array<{
    id: number; title: string; event_type: string; severity: string; risk_score: number; created_at: string;
  }>;
  latest_detection_rules: Array<{
    id: number; title: string; severity: string; mitre_ids: string[]; created_at: string;
  }>;
  latest_hunts: Array<{
    id: number; hunt_name: string; hunt_type: string; severity: string; risk_score: number; created_at: string;
  }>;
  recent_threat_intel: Array<{
    indicator: string; indicator_type: string; reputation: string; risk_score: number; tags: string[];
    investigation_title: string; created_at: string;
  }>;
};

export type ExecutiveReport = {
  report_markdown: string;
  generated_at: string;
};

export function fetchDashboardOverview(token: string) {
  return apiRequest<DashboardOverview>("/api/dashboard/overview", { method: "GET" }, token);
}

export function fetchExecutiveReport(token: string) {
  return apiRequest<ExecutiveReport>("/api/dashboard/report", { method: "GET" }, token);
}

