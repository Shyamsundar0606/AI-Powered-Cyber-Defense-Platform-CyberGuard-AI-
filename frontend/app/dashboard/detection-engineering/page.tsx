"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BrainCircuit,
  Clipboard,
  FileCode2,
  Loader2,
  LogOut,
  Radar,
  ShieldCheck,
} from "lucide-react";

import { AuthUser, clearAuthSession, fetchCurrentUser, getAuthToken, getStoredUser } from "@/lib/auth";
import {
  DetectionRuleHistoryItem,
  DetectionRuleResult,
  fetchDetectionHistory,
  generateDetectionRule,
  LogSource,
} from "@/lib/detection";
import { MitreTechnique, Severity } from "@/lib/soc";

const logSources: { label: string; value: LogSource }[] = [
  { label: "Windows Security", value: "windows_security" },
  { label: "PowerShell", value: "powershell" },
  { label: "Sysmon", value: "sysmon" },
  { label: "Linux Auth", value: "linux_auth" },
  { label: "Web Server", value: "web_server" },
  { label: "CloudTrail", value: "cloudtrail" },
];

const severityStyles: Record<Severity, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-amber-50 text-amber-700",
  High: "bg-orange-50 text-orange-700",
  Critical: "bg-rose-50 text-rose-700",
};

export default function DetectionEngineeringPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [title, setTitle] = useState("Multiple Failed Login Attempts");
  const [description, setDescription] = useState("Several failed login attempts for admin account from suspicious TOR IP");
  const [logSource, setLogSource] = useState<LogSource>("windows_security");
  const [suspiciousBehavior, setSuspiciousBehavior] = useState("brute force failed login");
  const [mitreIds, setMitreIds] = useState("T1110,T1078");
  const [result, setResult] = useState<DetectionRuleResult | null>(null);
  const [history, setHistory] = useState<DetectionRuleHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
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
    setTitle(params.get("title") || "Multiple Failed Login Attempts");
    setDescription(params.get("description") || "Several failed login attempts for admin account from suspicious TOR IP");
    setSuspiciousBehavior(params.get("behavior") || "brute force failed login");
    setMitreIds(params.get("mitre") || "T1110,T1078");
    const source = params.get("log_source") as LogSource | null;
    if (source && logSources.some((item) => item.value === source)) {
      setLogSource(source);
    }

    async function loadPage() {
      try {
        const [me, rules] = await Promise.all([
          fetchCurrentUser(authToken),
          fetchDetectionHistory(authToken),
        ]);
        setUser(me);
        setHistory(rules);
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

    setIsGenerating(true);
    setError("");
    try {
      const generated = await generateDetectionRule(
        {
          title,
          description,
          log_source: logSource,
          suspicious_behavior: suspiciousBehavior,
          mitre_technique_ids: parseMitreIds(mitreIds),
        },
        token,
      );
      setResult(generated);
      setHistory(await fetchDetectionHistory(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection rule generation failed.");
    } finally {
      setIsGenerating(false);
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
          Loading Detection Engineering...
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
            <Link href="/dashboard/soc-analyst" className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
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
            <Link href="/dashboard/detection-engineering" className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-3 text-sm text-white">
              <FileCode2 size={18} aria-hidden="true" />
              Detection Engineering
            </Link>
          </nav>
        </aside>

        <section className="px-6 py-6 lg:px-8">
          <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-700">Phase 6</p>
              <h1 className="mt-1 text-3xl font-semibold text-slate-950">Detection Engineering</h1>
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
                <FileCode2 className="text-cyan-700" size={24} aria-hidden="true" />
                <h2 className="text-lg font-semibold">Rule Context</h2>
              </div>
              <label className="text-sm font-medium text-slate-700">
                Title
                <input className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-500" value={title} onChange={(event) => setTitle(event.target.value)} required />
              </label>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Description
                <textarea className="mt-2 min-h-28 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-500" value={description} onChange={(event) => setDescription(event.target.value)} required />
              </label>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Log source
                <select className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-500" value={logSource} onChange={(event) => setLogSource(event.target.value as LogSource)}>
                  {logSources.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Suspicious behavior
                <input className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-500" value={suspiciousBehavior} onChange={(event) => setSuspiciousBehavior(event.target.value)} required />
              </label>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                MITRE technique IDs
                <input className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-500" value={mitreIds} onChange={(event) => setMitreIds(event.target.value)} placeholder="T1110,T1078" />
              </label>
              {error ? <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60" type="submit" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <FileCode2 size={18} aria-hidden="true" />}
                {isGenerating ? "Generating..." : "Generate detection package"}
              </button>
            </form>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <Clipboard className="text-cyan-700" size={24} aria-hidden="true" />
                <h2 className="text-lg font-semibold">Generated Rules</h2>
              </div>
              {result ? <DetectionResult result={result} /> : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  Generate a package to create Sigma and YARA rules, explanation, false positive notes, log sources, and MITRE cards.
                </div>
              )}
            </section>
          </div>

          <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Recent Generated Rules</h2>
            <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[1.3fr_0.6fr_0.9fr] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Title</span>
                <span>Severity</span>
                <span>MITRE</span>
              </div>
              {history.length ? history.map((item) => (
                <div key={item.id} className="grid grid-cols-[1.3fr_0.6fr_0.9fr] border-t border-slate-200 px-4 py-3 text-sm">
                  <span className="font-medium">{item.title}</span>
                  <span className={item.severity === "Critical" ? "text-rose-700" : item.severity === "High" ? "text-orange-700" : "text-slate-600"}>{item.severity}</span>
                  <span className="text-slate-500">{parseHistoryMitre(item.mitre_ids_json).join(", ") || "Unmapped"}</span>
                </div>
              )) : (
                <div className="border-t border-slate-200 px-4 py-4 text-sm text-slate-500">No generated rules stored yet.</div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function DetectionResult({ result }: { result: DetectionRuleResult }) {
  return (
    <div className="space-y-5">
      <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${severityStyles[result.severity]}`}>{result.severity}</span>
      <InfoBlock title="Explanation" items={[result.explanation]} />
      <CodeBlock title="Sigma Rule" code={result.sigma_rule} />
      <CodeBlock title="YARA Rule" code={result.yara_rule} />
      <InfoBlock title="False Positive Notes" items={result.false_positive_notes} />
      <InfoBlock title="Recommended Log Sources" items={result.recommended_log_sources} />
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">MITRE ATT&CK Mapping</h3>
        <div className="space-y-2">
          {result.mitre_mappings.length ? result.mitre_mappings.map((technique) => (
            <MitreCard key={technique.technique_id} technique={technique} />
          )) : <p className="text-sm text-slate-500">No MITRE mapping returned.</p>}
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  async function copyRule() {
    await navigator.clipboard.writeText(code);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <button className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50" type="button" onClick={copyRule}>
          <Clipboard size={14} aria-hidden="true" />
          Copy
        </button>
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-950 p-4 text-sm leading-6 text-slate-100">{code}</pre>
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

function parseMitreIds(value: string) {
  return value.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);
}

function parseHistoryMitre(value: string) {
  try {
    const parsed = JSON.parse(value) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
