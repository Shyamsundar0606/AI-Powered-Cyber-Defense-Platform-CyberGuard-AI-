"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BrainCircuit,
  Clock,
  FileCode2,
  FileText,
  History,
  Loader2,
  LogOut,
  Radar,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { AuthUser, clearAuthSession, fetchCurrentUser, getAuthToken, getStoredUser } from "@/lib/auth";
import {
  fetchHuntingHistory,
  HuntQueryResult,
  HuntingHistoryItem,
  HuntType,
  runHuntingQuery,
  TimelineItem,
} from "@/lib/hunting";
import { MitreTechnique, Severity } from "@/lib/soc";

const sampleLog = `2026-06-22 10:01:11 failed login for admin from 185.220.101.1
2026-06-22 10:01:20 invalid password for admin from 185.220.101.1
2026-06-22 10:01:35 failed login for admin from 185.220.101.1
2026-06-22 10:02:01 successful login for admin from 185.220.101.1`;

const huntTypes: { label: string; value: HuntType }[] = [
  { label: "Authentication", value: "authentication" },
  { label: "PowerShell", value: "powershell" },
  { label: "Network", value: "network" },
  { label: "Credential", value: "credential" },
  { label: "Generic", value: "generic" },
];

const severityStyles: Record<Severity, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-amber-50 text-amber-700",
  High: "bg-orange-50 text-orange-700",
  Critical: "bg-rose-50 text-rose-700",
};

export default function ThreatHuntingPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [huntName, setHuntName] = useState("Suspicious Login Hunt");
  const [huntType, setHuntType] = useState<HuntType>("authentication");
  const [query, setQuery] = useState("failed login admin powershell");
  const [logContent, setLogContent] = useState(sampleLog);
  const [result, setResult] = useState<HuntQueryResult | null>(null);
  const [history, setHistory] = useState<HuntingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHunting, setIsHunting] = useState(false);
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

    const params = new URLSearchParams(window.location.search);
    setHuntName(params.get("hunt_name") || "Suspicious Login Hunt");
    setQuery(params.get("query") || "failed login admin powershell");
    setLogContent(params.get("log_content") || sampleLog);
    const type = params.get("hunt_type") as HuntType | null;
    if (type && huntTypes.some((item) => item.value === type)) {
      setHuntType(type);
    }

    async function loadPage() {
      try {
        const [me, hunts] = await Promise.all([
          fetchCurrentUser(authToken),
          fetchHuntingHistory(authToken),
        ]);
        setUser(me);
        setHistory(hunts);
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

    setIsHunting(true);
    setError("");
    try {
      const huntResult = await runHuntingQuery(
        {
          hunt_name: huntName,
          log_content: logContent,
          query,
          hunt_type: huntType,
        },
        token,
      );
      setResult(huntResult);
      setHistory(await fetchHuntingHistory(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Threat hunt failed.");
    } finally {
      setIsHunting(false);
    }
  }

  function handleLogout() {
    clearAuthSession();
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 text-slate-950">
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
          Loading Threat Hunting...
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
              <p className="text-xs text-slate-400">Security Operations Center</p>
            </div>
          </div>
          <nav className="space-y-1">
            <SidebarLink href="/dashboard" icon={ArrowLeft} label="Overview" />
            <SidebarLink href="/dashboard/soc-analyst" icon={BrainCircuit} label="SOC Analyst" />
            <SidebarLink href="/dashboard/threat-intel" icon={Radar} label="Threat Intelligence" />
            <SidebarLink href="/dashboard/mitre" icon={Activity} label="MITRE Knowledge Base" />
            <SidebarLink href="/dashboard/detection-engineering" icon={FileCode2} label="Detection Engineering" />
            <SidebarLink href="/dashboard/threat-hunting" icon={Search} label="Threat Hunting" active />
            <SidebarLink href="/dashboard/reports" icon={FileText} label="Executive Reports" />
          </nav>
        </aside>

        <section className="px-6 py-6 lg:px-8">
          <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-950">Threat Hunting</h1>
              <p className="mt-2 text-sm text-slate-500">Search logs, detect suspicious activity, and reconstruct attack timelines.</p>
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

          <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
            <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
              <div className="mb-5 flex items-center gap-3">
                <ShieldAlert className="text-cyan-700" size={24} aria-hidden="true" />
                <h2 className="text-lg font-semibold">Hunt Query</h2>
              </div>
              <label className="text-sm font-medium text-slate-700">
                Hunt name
                <input className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-500" value={huntName} onChange={(event) => setHuntName(event.target.value)} required />
              </label>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Hunt type
                <select className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-500" value={huntType} onChange={(event) => setHuntType(event.target.value as HuntType)}>
                  {huntTypes.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Query
                <input className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-500" value={query} onChange={(event) => setQuery(event.target.value)} required />
              </label>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Log content
                <textarea className="mt-2 min-h-80 w-full rounded-md border border-slate-200 px-3 py-3 font-mono text-sm outline-none focus:border-cyan-500" value={logContent} onChange={(event) => setLogContent(event.target.value)} required />
              </label>
              {error ? <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60" type="submit" disabled={isHunting}>
                {isHunting ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
                {isHunting ? "Hunting..." : "Run hunt"}
              </button>
            </form>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <Activity className="text-cyan-700" size={24} aria-hidden="true" />
                <h2 className="text-lg font-semibold">Hunt Results</h2>
              </div>
              {result ? <HuntResults result={result} /> : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  Paste logs and run a hunt to find suspicious patterns, timeline events, MITRE mappings, and response actions.
                </div>
              )}
            </section>
          </div>

          <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <History className="text-cyan-700" size={24} aria-hidden="true" />
              <h2 className="text-lg font-semibold">Recent Hunts</h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[1.1fr_0.7fr_0.6fr_0.6fr] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Hunt</span>
                <span>Type</span>
                <span>Severity</span>
                <span>Risk</span>
              </div>
              {history.length ? history.map((item) => (
                <div key={item.id} className="grid grid-cols-[1.1fr_0.7fr_0.6fr_0.6fr] border-t border-slate-200 px-4 py-3 text-sm">
                  <span className="font-medium">{item.hunt_name}</span>
                  <span className="text-slate-500">{item.hunt_type}</span>
                  <span className={item.severity === "Critical" ? "text-rose-700" : item.severity === "High" ? "text-orange-700" : "text-slate-600"}>{item.severity}</span>
                  <span>{item.risk_score}/100</span>
                </div>
              )) : <div className="border-t border-slate-200 px-4 py-4 text-sm text-slate-500">No hunting history stored yet.</div>}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function HuntResults({ result }: { result: HuntQueryResult }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Score</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{result.risk_score}/100</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Severity</p>
          <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${severityStyles[result.severity]}`}>{result.severity}</span>
        </div>
      </div>
      <InfoBlock title="Summary" items={[result.summary]} />
      <TagBlock title="Suspicious Patterns" items={result.suspicious_patterns} />
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">MITRE ATT&CK Mappings</h3>
        <div className="space-y-2">
          {result.mitre_mappings.length ? result.mitre_mappings.map((technique) => <MitreCard key={technique.technique_id} technique={technique} />) : <p className="text-sm text-slate-500">No MITRE mappings found.</p>}
        </div>
      </div>
      <MatchesTable result={result} />
      <Timeline items={result.timeline} />
      <InfoBlock title="Recommended Actions" items={result.recommended_actions} />
    </div>
  );
}

function MatchesTable({ result }: { result: HuntQueryResult }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">Matching Log Lines</h3>
      <div className="overflow-hidden rounded-md border border-slate-200">
        <div className="grid grid-cols-[0.35fr_1.5fr_0.7fr] bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Line</span>
          <span>Event</span>
          <span>Patterns</span>
        </div>
        {result.matches.length ? result.matches.map((match) => (
          <div key={`${match.line_number}-${match.line}`} className="grid grid-cols-[0.35fr_1.5fr_0.7fr] border-t border-slate-200 px-3 py-3 text-sm">
            <span className="font-semibold text-slate-700">{match.line_number}</span>
            <span className="font-mono text-xs leading-5 text-slate-700">{match.line}</span>
            <span className="text-slate-500">{match.matched_patterns.join(", ")}</span>
          </div>
        )) : <div className="border-t border-slate-200 px-3 py-4 text-sm text-slate-500">No matching log lines.</div>}
      </div>
    </div>
  );
}

function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Clock size={16} aria-hidden="true" />
        Attack Timeline
      </h3>
      <div className="space-y-3">
        {items.length ? items.map((item, index) => (
          <div key={`${item.time}-${index}`} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[0.45fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.time}</p>
              <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${severityStyles[item.severity]}`}>{item.severity}</span>
            </div>
            <div className="text-sm">
              <p className="font-medium text-slate-950">{item.matched_pattern}</p>
              <p className="mt-1 font-mono text-xs leading-5 text-slate-600">{item.event}</p>
              <p className="mt-2 text-xs font-semibold text-cyan-700">{item.mitre_technique}</p>
            </div>
          </div>
        )) : <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">No timeline events generated.</p>}
      </div>
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
    </div>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
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

function TagBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.length ? items.map((item) => (
          <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{item}</span>
        )) : <span className="text-sm text-slate-500">No suspicious patterns found.</span>}
      </div>
    </div>
  );
}

function SidebarLink({ href, icon: Icon, label, active = false }: { href: string; icon: typeof Search; label: string; active?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm transition ${active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
      <Icon size={18} aria-hidden="true" />
      {label}
    </Link>
  );
}
