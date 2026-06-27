"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Activity, ArrowLeft, BrainCircuit, FileCode2, Loader2, LogOut, Radar, Search, ShieldCheck } from "lucide-react";

import { AuthUser, clearAuthSession, fetchCurrentUser, getAuthToken, getStoredUser } from "@/lib/auth";
import { enrichThreatIndicator, IndicatorType, ThreatIntelResult } from "@/lib/threat-intel";

const samples: Record<IndicatorType, string> = {
  ip: "185.220.101.1",
  domain: "evil-download-update.com",
  hash: "44d88612fea8a8f36de82e1278abb02f",
  cve: "CVE-2024-4577",
};

export default function ThreatIntelPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [indicatorType, setIndicatorType] = useState<IndicatorType>("ip");
  const [indicator, setIndicator] = useState(samples.ip);
  const [result, setResult] = useState<ThreatIntelResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
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
        setUser(await fetchCurrentUser(authToken));
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

  function handleTypeChange(nextType: IndicatorType) {
    setIndicatorType(nextType);
    setIndicator(samples[nextType]);
    setResult(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    setIsSearching(true);
    setError("");
    try {
      setResult(await enrichThreatIndicator({ indicator, type: indicatorType }, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Threat intelligence lookup failed.");
    } finally {
      setIsSearching(false);
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
          Loading threat intelligence...
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
            <Link href="/dashboard/threat-intel" className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-3 text-sm text-white">
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
            <Link href="/dashboard/threat-hunting" className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
              <Search size={18} aria-hidden="true" />
              Threat Hunting
            </Link>
          </nav>
        </aside>

        <section className="px-6 py-6 lg:px-8">
          <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-700">Phase 5</p>
              <h1 className="mt-1 text-3xl font-semibold text-slate-950">Threat Intelligence</h1>
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
                <Search className="text-cyan-700" size={24} aria-hidden="true" />
                <h2 className="text-lg font-semibold">Indicator Lookup</h2>
              </div>
              <label className="text-sm font-medium text-slate-700">
                Indicator type
                <select className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-500" value={indicatorType} onChange={(event) => handleTypeChange(event.target.value as IndicatorType)}>
                  <option value="ip">IP</option>
                  <option value="domain">Domain</option>
                  <option value="hash">Hash</option>
                  <option value="cve">CVE</option>
                </select>
              </label>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Indicator
                <input className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-500" value={indicator} onChange={(event) => setIndicator(event.target.value)} required />
              </label>
              {error ? <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60" type="submit" disabled={isSearching}>
                {isSearching ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Radar size={18} aria-hidden="true" />}
                {isSearching ? "Enriching..." : "Enrich indicator"}
              </button>
            </form>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <Radar className="text-cyan-700" size={24} aria-hidden="true" />
                <h2 className="text-lg font-semibold">Enrichment Result</h2>
              </div>
              {result ? (
                <ThreatIntelCard result={result} />
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  Search an IP, domain, hash, or CVE to generate offline reputation, tags, and recommendations.
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function ThreatIntelCard({ result }: { result: ThreatIntelResult }) {
  return (
    <article className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">{result.type.toUpperCase()}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">Risk {result.risk_score}/100</span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{result.reputation}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">Indicator</p>
        <h3 className="mt-1 text-2xl font-semibold text-slate-950">{result.indicator}</h3>
      </div>
      {result.severity || result.cvss ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {result.severity ? <InfoTile label="Severity" value={result.severity} /> : null}
          {result.cvss ? <InfoTile label="CVSS" value={String(result.cvss)} /> : null}
        </div>
      ) : null}
      {result.description ? <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-600">{result.description}</p> : null}
      <TagList title="Threat Tags" items={result.tags} />
      <SimpleList title="Recommendations" items={result.recommendations} />
      {result.mitigation.length ? <SimpleList title="Mitigation" items={result.mitigation} /> : null}
    </article>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function TagList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">{item}</span>
        ))}
      </div>
    </div>
  );
}

function SimpleList({ title, items }: { title: string; items: string[] }) {
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
