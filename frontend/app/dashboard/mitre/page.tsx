"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Activity, ArrowLeft, BrainCircuit, Loader2, LogOut, Search, ShieldCheck, Target } from "lucide-react";

import { AuthUser, clearAuthSession, fetchCurrentUser, getAuthToken, getStoredUser } from "@/lib/auth";
import { fetchMitreTechniques, mapLogToMitre } from "@/lib/mitre";
import { MitreTechnique } from "@/lib/soc";

const sampleLog = "PowerShell encoded command executed with suspicious download cradle behavior.";

export default function MitrePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [techniques, setTechniques] = useState<MitreTechnique[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MitreTechnique | null>(null);
  const [logContent, setLogContent] = useState(sampleLog);
  const [eventType, setEventType] = useState("endpoint");
  const [mappedTechniques, setMappedTechniques] = useState<MitreTechnique[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapping, setIsMapping] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const cachedUser = getStoredUser();
    if (cachedUser) {
      setUser(cachedUser);
    }

    async function loadPage() {
      try {
        const [me, mitreTechniques] = await Promise.all([
          fetchCurrentUser(token),
          fetchMitreTechniques(token),
        ]);
        setUser(me);
        setTechniques(mitreTechniques);
        setSelected(mitreTechniques[0] ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load MITRE knowledge base.");
      } finally {
        setIsLoading(false);
      }
    }

    loadPage();
  }, [router]);

  const filteredTechniques = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return techniques;
    }
    return techniques.filter((technique) => {
      const searchable = [
        technique.technique_id,
        technique.name,
        technique.tactic,
        technique.description,
        ...technique.example_keywords,
      ].join(" ").toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [query, techniques]);

  async function handleMapLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    setIsMapping(true);
    setError("");
    try {
      setMappedTechniques(await mapLogToMitre({ log_content: logContent, event_type: eventType }, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mapping failed.");
    } finally {
      setIsMapping(false);
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
          Loading MITRE knowledge base...
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
            <Link href="/dashboard/mitre" className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-3 text-sm text-white">
              <Activity size={18} aria-hidden="true" />
              MITRE Knowledge Base
            </Link>
          </nav>
        </aside>

        <section className="px-6 py-6 lg:px-8">
          <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-700">Phase 4</p>
              <h1 className="mt-1 text-3xl font-semibold text-slate-950">MITRE ATT&CK Knowledge Base</h1>
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

          {error ? <p className="mb-5 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <Search className="text-cyan-700" size={22} aria-hidden="true" />
                <h2 className="text-lg font-semibold">Technique Search</h2>
              </div>
              <input className="mb-4 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-500" placeholder="Search by ID, tactic, or keyword" value={query} onChange={(event) => setQuery(event.target.value)} />
              <div className="max-h-[560px] space-y-2 overflow-auto pr-1">
                {filteredTechniques.map((technique) => (
                  <button key={technique.technique_id} className={`w-full rounded-md border px-3 py-3 text-left text-sm transition ${selected?.technique_id === technique.technique_id ? "border-cyan-300 bg-cyan-50" : "border-slate-200 bg-slate-50 hover:border-cyan-200"}`} type="button" onClick={() => setSelected(technique)}>
                    <span className="font-semibold text-slate-950">{technique.technique_id} - {technique.name}</span>
                    <span className="mt-1 block text-slate-600">{technique.tactic}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-5">
              {selected ? <TechniqueCard technique={selected} /> : null}

              <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleMapLog}>
                <div className="mb-4 flex items-center gap-3">
                  <Target className="text-cyan-700" size={22} aria-hidden="true" />
                  <h2 className="text-lg font-semibold">Log-to-MITRE Test</h2>
                </div>
                <label className="text-sm font-medium text-slate-700">
                  Event type
                  <select className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-500" value={eventType} onChange={(event) => setEventType(event.target.value)}>
                    <option value="authentication">Authentication</option>
                    <option value="network">Network</option>
                    <option value="endpoint">Endpoint</option>
                    <option value="malware">Malware</option>
                  </select>
                </label>
                <label className="mt-4 block text-sm font-medium text-slate-700">
                  Log content
                  <textarea className="mt-2 min-h-32 w-full rounded-md border border-slate-200 px-3 py-3 font-mono text-sm outline-none focus:border-cyan-500" value={logContent} onChange={(event) => setLogContent(event.target.value)} />
                </label>
                <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60" type="submit" disabled={isMapping}>
                  {isMapping ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Activity size={18} aria-hidden="true" />}
                  {isMapping ? "Mapping..." : "Map log to MITRE"}
                </button>
                <div className="mt-4 space-y-3">
                  {mappedTechniques.length ? mappedTechniques.map((technique) => <TechniqueCard key={technique.technique_id} technique={technique} compact />) : null}
                </div>
              </form>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function TechniqueCard({ technique, compact = false }: { technique: MitreTechnique; compact?: boolean }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-sm font-semibold text-cyan-700">{technique.technique_id}</span>
        <h2 className="text-lg font-semibold text-slate-950">{technique.name}</h2>
      </div>
      <p className="mt-2 text-sm font-medium text-slate-700">{technique.tactic}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{technique.description}</p>
      {technique.matched_keywords.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {technique.matched_keywords.map((keyword) => (
            <span key={keyword} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{keyword}</span>
          ))}
        </div>
      ) : null}
      {!compact ? (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <DetailList title="Log Sources" items={technique.common_log_sources} />
          <DetailList title="Detection Ideas" items={technique.detection_ideas} />
          <DetailList title="Mitigation" items={technique.mitigation} />
        </div>
      ) : (
        <div className="mt-4">
          <DetailList title="Detection Ideas" items={technique.detection_ideas.slice(0, 2)} />
        </div>
      )}
    </article>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="mt-2 space-y-1 text-sm text-slate-600">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}
