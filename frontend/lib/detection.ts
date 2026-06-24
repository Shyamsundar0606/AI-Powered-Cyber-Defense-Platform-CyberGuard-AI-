import { apiRequest } from "./api";
import { MitreTechnique, Severity } from "./soc";

export type LogSource =
  | "windows_security"
  | "powershell"
  | "sysmon"
  | "linux_auth"
  | "web_server"
  | "cloudtrail";

export type DetectionRulePayload = {
  title: string;
  description: string;
  log_source: LogSource;
  suspicious_behavior: string;
  mitre_technique_ids: string[];
};

export type DetectionRuleResult = {
  sigma_rule: string;
  yara_rule: string;
  explanation: string;
  false_positive_notes: string[];
  recommended_log_sources: string[];
  mitre_mappings: MitreTechnique[];
  severity: Severity;
};

export type DetectionRuleHistoryItem = {
  id: number;
  title: string;
  sigma_rule: string;
  yara_rule: string;
  severity: Severity;
  mitre_ids_json: string;
  created_at: string;
};

export async function generateDetectionRule(payload: DetectionRulePayload, token: string) {
  return apiRequest<DetectionRuleResult>(
    "/api/detection/generate",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function fetchDetectionHistory(token: string) {
  return apiRequest<DetectionRuleHistoryItem[]>("/api/detection/history", { method: "GET" }, token);
}
