import { apiRequest } from "./api";

export type Severity = "Low" | "Medium" | "High" | "Critical";

export type SocAnalyzePayload = {
  title: string;
  log_content: string;
  source_ip: string;
  destination_ip: string;
  username: string;
  event_type: string;
};

export type MitreTechnique = {
  technique_id: string;
  name: string;
  tactic: string;
  description: string;
  common_log_sources: string[];
  detection_ideas: string[];
  mitigation: string[];
  example_keywords: string[];
  matched_keywords: string[];
};

export type SocAnalysisResult = {
  severity: Severity;
  risk_score: number;
  summary: string;
  suspicious_indicators: string[];
  mitre_techniques: MitreTechnique[];
  recommended_actions: string[];
  incident_report: string;
};

export type InvestigationHistoryItem = {
  id: number;
  title: string;
  source_ip: string;
  destination_ip: string;
  username: string;
  event_type: string;
  severity: Severity;
  risk_score: number;
  summary: string;
  mitre_mappings_json?: string | null;
  created_at: string;
};

export async function analyzeSocAlert(payload: SocAnalyzePayload, token: string) {
  return apiRequest<SocAnalysisResult>(
    "/api/soc/analyze",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function fetchSocHistory(token: string) {
  return apiRequest<InvestigationHistoryItem[]>("/api/soc/history", { method: "GET" }, token);
}
