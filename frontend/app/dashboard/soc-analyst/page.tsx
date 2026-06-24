"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BrainCircuit,
  FileCode2,
  FileText,
  History,
  Loader2,
  LogOut,
  Radar,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { AuthUser, clearAuthSession, fetchCurrentUser, getAuthToken, getStoredUser } from "@/lib/auth";
import { ThreatIntelResult } from "@/lib/threat-intel";
import {
  analyzeSocAlert,
  fetchSocHistory,
  InvestigationHistoryItem,
  MitreTechnique,
  SocAnalysisResult,
  Severity,
} from "@/lib/soc";

const sampleLog = `2026-06-19T09:14:22Z auth-gateway failed login for admin from 203.0.113.50
2026-06-19T09:14:24Z auth-gateway failed login for admin from 203.0.113.50
2026-06-19T09:14:26Z brute force threshold exceeded for privileged account admin`;

const severityStyles: Record<Severity, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-amber-50 text-amber-700",
  High: "bg-orange-50 text-orange-700",
  Critical: "bg-rose-50 text-rose-700",
};

export default function SocAnalystPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [title, setTitle] = useState("Multiple Failed Login Attempts");
  const [sourceIp, setSourceIp] = useState("192.168.1.10");
  const [destinationIp, setDestinationIp] = useState("10.0.0.5");
  const [username, setUsername] = useState("admin");
  const [eventType, setEventType] = useState("authentication");
  const [logContent, setLogContent] = useState(sampleLog);
  const [result, setResult] = useState<SocAnalysisResult | null>(null);
  const [history, setHistory] = useState<InvestigationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const authToken = token;

    const cachedUser = getStoredUser();
    if (cachedUser) {
      setUser(cachedUser);
    }

    async function loadPage() {
      try {
        const [me, investigations] = await Promise.all([
          fetchCurrentUser(authToken),
          fetchSocHistory(authToken),
        ]);
        setUser(me);
        setHistory(investigations);
      } catch (err) {
        clearAuthSession();
        setError(err instanceof Error ? err.message : "Session expired.");
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    }

    loadPage();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    try {
      const analysis = await analyzeSocAlert(
        {
          title,
          log_content: logContent,
          source_ip: sourceIp,
          destination_ip: destinationIp,
          username,
          event_type: eventType,
        },
        token,
      );
      setResult(analysis);
      setHistory(await fetchSocHistory(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleLogout() {
    clearAuthSession();
    router.replace("/login");
  }

  function handleGenerateDetectionRule() {
    if (!result) {
      return;
    }
    const params = new URLSearchParams({
      title,
      description: result.summary,
      behavior: result.suspicious_indicators.join("; "),
      mitre: result.mitre_techniques.map((technique) => technique.technique_id).join(","),
      log_source: eventType === "authentication" ? "windows_security" : eventType === "malware" ? "powershell" : "sysmon",
    });
    router.push(`/dashboard/detection-engineering?${params.toString()}`);
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 text-slate-950">
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
          Loading SOC Analyst...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200 bg-slate-950 px-5 py-6 text-slate-100">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-300 text-slate-950">
              <ShieldCheck size={22} aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold">CyberGuard AI</p>
              <p className="text-xs text-slate-400">SOC command center</p>
            </div>
          </div>
          <nav className="space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
              <ArrowLeft size={18} aria-hidden="true" />
              Overview
            </Link>
            <Link href="/dashboard/soc-analyst" className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-3 text-sm text-white">
              <BrainCircuit size={18} aria-hidden="true" />
              SOC Analyst
            </Link>
            <Link href="/dashboard/threat-intel" className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
              <Radar size={18} aria-hidden="true" />
              Threat Intelligence
            </Link>
            <Link href="/dashboard/mitre" className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
              <Activity size={18} aria-hidden="true" />
              MITRE Knowledge Base
            </Link>
            <Link href="/dashboard/detection-engineering" className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
              <FileCode2 size={18} aria-hidden="true" />
              Detection Engineering
            </Link>
          </nav>
        </aside>

        <section className="px-6 py-6 lg:px-8">
          <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-700">Phase 5</p>
              <h1 className="mt-1 text-3xl font-semibold text-slate-950">AI SOC Analyst</h1>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                Signed in as <span className="font-semibold text-slate-950">{user?.username}</span>
              </div>
              <button className="flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" type="button" onClick={handleLogout}>
                <LogOut size={16} aria-hidden="true" />
                Logout
              </button>
            </div>
          </header>

          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
              <div className="mb-5 flex items-center gap-3">
                <ShieldAlert className="text-cyan-700" size={24} aria-hidden="true" />
                <h2 className="text-lg font-semibold">Alert Context</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                  Alert title
                  <input className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-500" value={title} onChange={(event) => setTitle(event.target.value)} required />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Source IP
                  <input className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-500" value={sourceIp} onChange={(event) => setSourceIp(event.target.value)} required />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Destination IP
                  <input className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-500" value={destinationIp} onChange={(event) => setDestinationIp(event.target.value)} required />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Username
                  <input className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-500" value={username} onChange={(event) => setUsername(event.target.value)} required />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Event type
                  <select className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-500" value={eventType} onChange={(event) => setEventType(event.target.value)}>
                    <option value="authentication">Authentication</option>
                    <option value="network">Network</option>
                    <option value="malware">Malware</option>
                    <option value="endpoint">Endpoint</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                  Log content
                  <textarea className="mt-2 min-h-52 w-full rounded-md border border-slate-200 px-3 py-3 font-mono text-sm outline-none focus:border-cyan-500" value={logContent} onChange={(event) => setLogContent(event.target.value)} required />
                </label>
              </div>

              {error ? <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60" type="submit" disabled={isAnalyzing}>
                {isAnalyzing ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Activity size={18} aria-hidden="true" />}
                {isAnalyzing ? "Analyzing..." : "Analyze alert"}
              </button>
            </form>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <FileText className="text-cyan-700" size={24} aria-hidden="true" />
                <h2 className="text-lg font-semibold">Analysis Result</h2>
              </div>

              {result ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${severityStyles[result.severity]}`}>{result.severity}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">Risk {result.risk_score}/100</span>
                    <button className="inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100" type="button" onClick={handleGenerateDetectionRule}>
                      <FileCode2 size={16} aria-hidden="true" />
                      Generate Detection Rule
                    </button>
                  </div>
                  <ResultBlock title="Summary" items={[result.summary]} />
                  <ResultBlock title="Suspicious Indicators" items={result.suspicious_indicators} />
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-700">MITRE ATT&CK Mappings</h3>
                    <div className="space-y-2">
                      {result.mitre_techniques.length ? (
                        result.mitre_techniques.map((technique) => <MitreCard key={technique.technique_id} technique={technique} />)
                      ) : (
                        <p className="text-sm text-slate-500">No direct MITRE mapping.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-700">Threat Intelligence Enrichment</h3>
                    <div className="space-y-2">
                      {result.threat_intel_results.length ? (
                        result.threat_intel_results.map((intel) => <ThreatIntelCard key={`${intel.type}-${intel.indicator}`} intel={intel} />)
                      ) : (
                        <p className="text-sm text-slate-500">No threat intelligence enrichment available.</p>
                      )}
                    </div>
                  </div>
                  <ResultBlock title="Recommended Actions" items={result.recommended_actions} />
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-700">Incident Report</h3>
                    <pre className="whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-950 p-4 text-sm leading-6 text-slate-100">{result.incident_report}</pre>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  Submit an alert to generate severity, risk score, indicators, MITRE mapping, actions, and an incident report.
                </div>
              )}
            </section>
          </div>

          <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <History className="text-cyan-700" size={24} aria-hidden="true" />
              <h2 className="text-lg font-semibold">Recent Investigations</h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Title</span>
                <span>Severity</span>
                <span>Risk</span>
                <span>User</span>
              </div>
              {history.length ? (
                history.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] border-t border-slate-200 px-4 py-3 text-sm">
                    <span className="font-medium">{item.title}</span>
                    <span className={item.severity === "Critical" ? "text-rose-700" : item.severity === "High" ? "text-orange-700" : "text-slate-600"}>{item.severity}</span>
                    <span>{item.risk_score}/100</span>
                    <span className="text-slate-500">{item.username}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-4 text-sm text-slate-500">No investigations stored yet.</div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function ResultBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      <ul className="space-y-2 text-sm text-slate-600">
        {items.map((item) => (
          <li key={item} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">{item}</li>
        ))}
      </ul>
    </div>
  );
}

function MitreCard({ technique }: { technique: MitreTechnique }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700">{technique.technique_id}</span>
        <p className="font-semibold text-slate-950">{technique.name}</p>
      </div>
      <p className="mt-2 font-medium text-slate-700">{technique.tactic}</p>
      <p className="mt-2 leading-6 text-slate-600">{technique.description}</p>
      {technique.matched_keywords.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {technique.matched_keywords.map((keyword) => (
            <span key={keyword} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">{keyword}</span>
          ))}
        </div>
      ) : null}
      <MiniList title="Detection Ideas" items={technique.detection_ideas} />
      <MiniList title="Mitigation" items={technique.mitigation} />
    </div>
  );
}

function ThreatIntelCard({ intel }: { intel: ThreatIntelResult }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700">{intel.type.toUpperCase()}</span>
        <p className="font-semibold text-slate-950">{intel.indicator}</p>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">Risk {intel.risk_score}/100</span>
      </div>
      <p className="mt-2 font-medium text-slate-700">{intel.reputation}</p>
      {intel.description ? <p className="mt-2 leading-6 text-slate-600">{intel.description}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {intel.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">{tag}</span>
        ))}
      </div>
      <MiniList title="Recommendations" items={intel.recommendations} />
    </div>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="mt-2 space-y-1 text-slate-600">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}
