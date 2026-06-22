import { apiRequest } from "./api";

export type IndicatorType = "ip" | "domain" | "hash" | "cve";

export type ThreatIntelResult = {
  indicator: string;
  type: IndicatorType;
  risk_score: number;
  reputation: string;
  tags: string[];
  recommendations: string[];
  severity?: string | null;
  cvss?: number | null;
  description?: string | null;
  mitigation: string[];
};

export type ThreatIntelPayload = {
  indicator: string;
  type: IndicatorType;
};

export async function enrichThreatIndicator(payload: ThreatIntelPayload, token: string) {
  return apiRequest<ThreatIntelResult>(
    "/api/threat-intel/enrich",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function fetchIpIntel(ip: string, token: string) {
  return apiRequest<ThreatIntelResult>(`/api/threat-intel/ip/${encodeURIComponent(ip)}`, { method: "GET" }, token);
}

export async function fetchCveIntel(cve: string, token: string) {
  return apiRequest<ThreatIntelResult>(`/api/threat-intel/cve/${encodeURIComponent(cve)}`, { method: "GET" }, token);
}
