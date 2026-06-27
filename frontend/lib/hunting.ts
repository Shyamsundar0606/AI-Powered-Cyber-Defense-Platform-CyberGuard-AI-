import { apiRequest } from "./api";
import { MitreTechnique, Severity } from "./soc";

export type HuntType = "authentication" | "powershell" | "network" | "credential" | "generic";

export type HuntQueryPayload = {
  hunt_name: string;
  log_content: string;
  query: string;
  hunt_type: HuntType;
};

export type HuntMatch = {
  line_number: number;
  line: string;
  matched_patterns: string[];
  severity: Severity;
  mitre_technique_ids: string[];
};

export type TimelineItem = {
  time: string;
  event: string;
  matched_pattern: string;
  severity: Severity;
  mitre_technique: string;
};

export type HuntQueryResult = {
  hunt_name: string;
  matches: HuntMatch[];
  timeline: TimelineItem[];
  risk_score: number;
  severity: Severity;
  summary: string;
  suspicious_patterns: string[];
  mitre_mappings: MitreTechnique[];
  recommended_actions: string[];
};

export type HuntingHistoryItem = {
  id: number;
  hunt_name: string;
  query: string;
  hunt_type: string;
  risk_score: number;
  severity: Severity;
  summary: string;
  matches_json: string;
  timeline_json: string;
  mitre_mappings_json: string;
  created_at: string;
};

export async function runHuntingQuery(payload: HuntQueryPayload, token: string) {
  return apiRequest<HuntQueryResult>(
    "/api/hunting/query",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function fetchHuntingHistory(token: string) {
  return apiRequest<HuntingHistoryItem[]>("/api/hunting/history", { method: "GET" }, token);
}
