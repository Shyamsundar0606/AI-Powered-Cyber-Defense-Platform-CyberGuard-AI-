"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  BrainCircuit,
  FileCode2,
  LayoutDashboard,
  LogOut,
  Radar,
  ShieldCheck,
} from "lucide-react";

import {
  AuthUser,
  clearAuthSession,
  fetchCurrentUser,
  fetchProtectedDashboard,
  getAuthToken,
  getStoredUser,
  ProtectedDashboardResponse,
} from "@/lib/auth";
import { fetchSocHistory, InvestigationHistoryItem } from "@/lib/soc";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "SOC Analyst", href: "/dashboard/soc-analyst", icon: BrainCircuit },
  { label: "Threat Intelligence", href: "/dashboard/threat-intel", icon: Radar },
  { label: "MITRE Knowledge Base", href: "/dashboard/mitre", icon: Activity },
  { label: "Detection Engineering", href: "/dashboard/detection-engineering", icon: FileCode2 },
];

const cards = [
  {
    title: "SOC Analyst",
    value: "Alert triage",
    description: "Analyze suspicious events and generate investigation notes.",
    icon: BrainCircuit,
    href: "/dashboard/soc-analyst",
  },
  {
    title: "Threat Intelligence",
    value: "Enrichment",
    description: "Score IPs, domains, hashes, and CVEs with offline logic.",
    icon: Radar,
    href: "/dashboard/threat-intel",
  },
  {
    title: "MITRE ATT&CK Knowledge Base",
    value: "ATT&CK",
    description: "Search local techniques and map logs to adversary behaviors.",
    icon: Activity,
    href: "/dashboard/mitre",
  },
  {
    title: "Detection Engineering",
    value: "Sigma/YARA",
    description: "Prepare high-signal detection rules from alert context.",
    icon: FileCode2,
    href: "/dashboard/detection-engineering",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dashboard, setDashboard] = useState<ProtectedDashboardResponse | null>(null);
  const [history, setHistory] = useState<InvestigationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

    async function loadDashboard() {
      try {
        const [me, protectedData, investigations] = await Promise.all([
          fetchCurrentUser(authToken),
          fetchProtectedDashboard(authToken),
          fetchSocHistory(authToken),
        ]);
        setUser(me);
        setDashboard(protectedData);
        setHistory(investigations);
      } catch (err) {
        clearAuthSession();
        setError(err instanceof Error ? err.message : "Session expired.");
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  function handleLogout() {
    clearAuthSession();
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 text-slate-950">
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
          Loading secure dashboard...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 text-slate-950">
        <div className="rounded-lg border border-rose-200 bg-white px-6 py-5 text-rose-700 shadow-sm">
          {error || "Redirecting to login..."}
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
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <item.icon size={18} aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="px-6 py-6 lg:px-8">
          <header className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-700">Phase 6</p>
              <h1 className="mt-1 text-3xl font-semibold text-slate-950">Security Dashboard</h1>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                Signed in as <span className="font-semibold text-slate-950">{user.username}</span>{" "}
                <span className="text-slate-400">({user.email})</span>
                {user.role === "admin" ? (
                  <span className="ml-2 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
                    Admin
                  </span>
                ) : null}
              </div>
              <button
                className="flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                type="button"
                onClick={handleLogout}
              >
                <LogOut size={16} aria-hidden="true" />
                Logout
              </button>
            </div>
          </header>

          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {dashboard?.message ?? "Authenticated dashboard access granted."}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <Link key={card.title} href={card.href} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-200 hover:shadow-md">
                <div className="mb-5 flex items-center justify-between">
                  <card.icon className="text-cyan-700" size={24} aria-hidden="true" />
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    Ready
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">{card.value}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
              </Link>
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Recent Investigations</h2>
              <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
                <div className="grid grid-cols-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Signal</span>
                  <span>Severity</span>
                  <span>Status</span>
                </div>
                {history.length ? (
                  history.map((event) => (
                    <div key={event.id} className="grid grid-cols-3 border-t border-slate-200 px-4 py-3 text-sm">
                      <span className="font-medium">{event.title}</span>
                      <span className={event.severity === "Critical" ? "text-rose-700" : event.severity === "High" ? "text-orange-700" : "text-amber-700"}>
                        {event.severity}
                      </span>
                      <span className="text-slate-500">Risk {event.risk_score}/100</span>
                    </div>
                  ))
                ) : (
                  <div className="border-t border-slate-200 px-4 py-4 text-sm text-slate-500">
                    No SOC investigations yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Platform Readiness</h2>
              <div className="mt-5 space-y-4">
                {[
                  "JWT authentication",
                  "Password hashing",
                  "SQLite user database",
                  "SOC alert analyzer",
                  "MITRE knowledge base",
                  "Threat intelligence enrichment",
                  "Detection engineering",
                ].map((item) => (
                  <div key={item} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-600">{item}</span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                      Done
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
