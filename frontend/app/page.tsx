import Link from "next/link";
import { Activity, BrainCircuit, FileCode2, Radar, ShieldCheck } from "lucide-react";

const modules = [
  {
    title: "SOC Analyst",
    description: "Alert triage, severity scoring, and incident summaries.",
    icon: BrainCircuit,
  },
  {
    title: "Threat Intel",
    description: "Offline-first enrichment for IPs, domains, hashes, and CVEs.",
    icon: Radar,
  },
  {
    title: "MITRE Mapping",
    description: "Technique mapping for common adversary behaviors.",
    icon: Activity,
  },
  {
    title: "Detection Rules",
    description: "Sigma and YARA-ready rule generation workflows.",
    icon: FileCode2,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(20,184,166,0.18),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(248,113,113,0.16),transparent_32%),linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:auto,auto,42px_42px,42px_42px]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-14">
          <div className="flex min-h-[520px] flex-col justify-between">
            <nav className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-400 text-slate-950">
                  <ShieldCheck size={22} aria-hidden="true" />
                </span>
                <span className="text-lg font-semibold tracking-wide">CyberGuard AI</span>
              </div>
              <Link
                href="/dashboard"
                className="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-300/10"
              >
                Dashboard
              </Link>
            </nav>

            <div className="max-w-2xl py-16">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">
                AI-powered security operations platform
              </p>
              <h1 className="text-5xl font-semibold leading-tight text-white sm:text-6xl">
                CyberGuard AI
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                An enterprise cyber defense workspace for alert triage, threat
                intelligence, MITRE ATT&CK mapping, and detection engineering.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-md bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                >
                  Open dashboard
                </Link>
                <a
                  href="http://localhost:8000/docs"
                  className="rounded-md border border-white/15 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  API docs
                </a>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm text-slate-300">
              <div className="border-l border-cyan-300/50 pl-3">
                <strong className="block text-xl text-white">4</strong>
                Core modules
              </div>
              <div className="border-l border-rose-300/50 pl-3">
                <strong className="block text-xl text-white">JWT</strong>
                Auth ready
              </div>
              <div className="border-l border-amber-300/50 pl-3">
                <strong className="block text-xl text-white">Local</strong>
                AI fallback
              </div>
            </div>
          </div>

          <div className="self-end rounded-lg border border-white/10 bg-slate-900/75 p-4 shadow-2xl shadow-cyan-950/40 backdrop-blur">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-sm font-semibold text-white">Security Operations</p>
                <p className="text-xs text-slate-400">Unified security operations workspace</p>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-200">
                Online
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {modules.map((module) => (
                <div key={module.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <module.icon className="mb-4 text-cyan-200" size={24} aria-hidden="true" />
                  <h2 className="text-base font-semibold text-white">{module.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{module.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
