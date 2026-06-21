import { apiRequest } from "./api";
import { MitreTechnique } from "./soc";

export type MitreMapLogPayload = {
  log_content: string;
  event_type?: string;
};

export async function fetchMitreTechniques(token: string) {
  return apiRequest<MitreTechnique[]>("/api/mitre/techniques", { method: "GET" }, token);
}

export async function fetchMitreTechnique(techniqueId: string, token: string) {
  return apiRequest<MitreTechnique>(`/api/mitre/techniques/${encodeURIComponent(techniqueId)}`, { method: "GET" }, token);
}

export async function mapLogToMitre(payload: MitreMapLogPayload, token: string) {
  return apiRequest<MitreTechnique[]>(
    "/api/mitre/map-log",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}
