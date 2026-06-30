"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity, AlertTriangle, BrainCircuit, FileCode2, FileText, Gauge,
  LayoutDashboard, LogOut, Radar, Search, ShieldCheck, Siren,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import {
  clearAuthSession, fetchCurrentUser, getAuthToken, getStoredUser, type AuthUser,
} from "@/lib/auth";
import { fetchDashboardOverview, type DashboardOverview } from "@/lib/dashboard";

const COLORS = ["#e11d48", "#ea580c", "#d97706", "#0891b2", "#64748b"];

const navItems = [
  ["Overview", "/dashboard", LayoutDashboard],
  ["SOC Analyst", "/dashboard/soc-analyst", BrainCircuit],
  ["Threat Intelligence", "/dashboard/threat-intel", Radar],
  ["MITRE Knowledge Base", "/dashboard/mitre", Activity],
  ["Detection Engineering", "/dashboard/detection-engineering", FileCode2],
  ["Threat Hunting", "/dashboard/threat-hunting", Search],
  ["Executive Reports", "/dashboard/reports", FileText],
] as const;

const quickActions = [
  ["New Investigation", "/dashboard/soc-analyst", BrainCircuit],
  ["Threat Hunt", "/dashboard/threat-hunting", Search],
  ["Detection Rule", "/dashboard/detection-engineering", FileCode2],
  ["Threat Intel Lookup", "/dashboard/threat-intel", Radar],
  ["MITRE Search", "/dashboard/mitre", Activity],
] as const;

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5"><h2 className="text-lg font-semibold">{title}</h2>{subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}</div>
      {children}
    </section>
  );
}

function EmptyChart() {
  return <div className="grid h-[250px] place-items-center text-sm text-slate-400">No recorded data yet</div>;
}

function Severity({ value }: { value: string }) {
  const style = value === "Critical" ? "bg-rose-50 text-rose-700" : value === "High" ? "bg-orange-50 text-orange-700" : value === "Medium" ? "bg-amber-50 text-amber-700" : "bg-cyan-50 text-cyan-700";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{value}</span>;
}

function compactDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setUser(getStoredUser());
    Promise.all([fetchCurrentUser(token), fetchDashboardOverview(token)])
      .then(([currentUser, data]) => { setUser(currentUser); setOverview(data); })
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Unable to load dashboard.");
        if (String(reason).toLowerCase().includes("credential")) {
          clearAuthSession();
          router.replace("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  function logout() {
    clearAuthSession();
    router.replace("/login");
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-slate-100 text-slate-600">Loading security operations metrics...</main>;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-800 bg-slate-950 px-5 py-6 text-slate-100">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-300 text-slate-950"><ShieldCheck size={22} /></span>
            <div><p className="font-semibold">CyberGuard AI</p><p className="text-xs text-slate-400">Security Operations Center</p></div>
          </div>
          <nav className="space-y-1">
            {navItems.map(([label, href, Icon]) => (
              <Link key={href} href={href} className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm ${href === "/dashboard" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
                <Icon size={18} />{label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 px-5 py-6 lg:px-8">
          <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 xl:flex-row xl:items-center xl:justify-between">
            <div><p className="text-sm font-medium text-cyan-700">CyberGuard AI</p><h1 className="mt-1 text-3xl font-semibold">Security Operations Center</h1><p className="mt-2 text-sm text-slate-500">Real-time security monitoring, threat detection, and incident response analytics powered by CyberGuard AI.</p></div>
            <div className="flex flex-wrap items-center gap-3">
              {user ? <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">Signed in as <strong className="text-slate-950">{user.username}</strong>{user.role === "admin" ? <span className="ml-2 rounded-full bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700">Admin</span> : null}</div> : null}
              <button onClick={logout} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"><LogOut size={16} />Logout</button>
            </div>
          </header>

          {error ? <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
          {!overview ? null : (
            <>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {([
                  ["Total Alerts", overview.total_alerts, Siren, "text-slate-700", "All investigations"],
                  ["Critical Alerts", overview.critical_alerts, AlertTriangle, "text-rose-600", "Immediate review"],
                  ["Threat Hunts", overview.total_hunts, Search, "text-cyan-700", `${overview.hunting_statistics.high_risk_hunts} high risk`],
                  ["Detection Rules", overview.total_detection_rules, FileCode2, "text-emerald-700", "Sigma and YARA"],
                  ["Security Score", `${overview.security_score}/100`, Gauge, "text-violet-700", "Operational posture"],
                ] as const).map(([label, value, Icon, color, detail]) => (
                  <div key={String(label)} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">{label as string}</p><Icon className={color as string} size={20} /></div>
                    <p className="mt-3 text-3xl font-semibold">{value as string | number}</p><p className="mt-2 text-xs text-slate-500">{detail as string}</p>
                  </div>
                ))}
              </section>

              <section className="mt-5 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <span className="mr-2 text-sm font-semibold text-slate-700">Quick actions</span>
                {quickActions.map(([label, href, Icon]) => <Link key={href} href={href} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"><Icon size={16} />{label}</Link>)}
              </section>

              <section className="mt-5 grid gap-4 xl:grid-cols-3">
                <Panel title="Security Score" subtitle="Risk pressure balanced against detection coverage">
                  <div className="flex h-[250px] items-center justify-center">
                    <div className="relative grid h-44 w-44 place-items-center rounded-full" style={{ background: `conic-gradient(#0891b2 ${overview.security_score * 3.6}deg, #e2e8f0 0deg)` }}>
                      <div className="grid h-32 w-32 place-items-center rounded-full bg-white text-center"><div><p className="text-4xl font-semibold">{overview.security_score}</p><p className="text-xs text-slate-500">out of 100</p></div></div>
                    </div>
                  </div>
                </Panel>

                <Panel title="Severity Distribution" subtitle={`${overview.average_risk_score}/100 average alert risk`}>
                  {overview.total_alerts ? <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={overview.severity_distribution} dataKey="value" nameKey="label" innerRadius={55} outerRadius={85} paddingAngle={2}>{overview.severity_distribution.map((item, index) => <Cell key={item.label} fill={COLORS[index]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div> : <EmptyChart />}
                </Panel>

                <Panel title="Top MITRE Techniques" subtitle="Across investigations and threat hunts">
                  {overview.top_mitre.length ? <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={overview.top_mitre} layout="vertical" margin={{ left: 8, right: 16 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="technique_id" width={58} /><Tooltip formatter={(value) => [`${value} mappings`, "Count"]} /><Bar dataKey="count" fill="#0891b2" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div> : <EmptyChart />}
                </Panel>
              </section>

              <section className="mt-4 grid gap-4 xl:grid-cols-3">
                <Panel title="Threat Intel Categories" subtitle={`${overview.high_risk_iocs} high-risk indicators`}>
                  {overview.threat_intel_statistics.categories.length ? <div className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={overview.threat_intel_statistics.categories} dataKey="value" nameKey="label" outerRadius={82}>{overview.threat_intel_statistics.categories.map((item, index) => <Cell key={item.label} fill={COLORS[(index + 2) % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div> : <EmptyChart />}
                </Panel>
                <Panel title="Critical Alert Trend" subtitle="Last seven days">
                  <div className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={overview.critical_alert_trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={compactDate} /><YAxis allowDecimals={false} /><Tooltip labelFormatter={(value) => compactDate(String(value))} /><Line type="monotone" dataKey="value" name="Critical alerts" stroke="#e11d48" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
                </Panel>
                <Panel title="Detection Rule Trend" subtitle="Rules created in the last seven days">
                  <div className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={overview.detection_statistics.trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={compactDate} /><YAxis allowDecimals={false} /><Tooltip labelFormatter={(value) => compactDate(String(value))} /><Line type="monotone" dataKey="value" name="Detection rules" stroke="#059669" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
                </Panel>
              </section>

              <section className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
                <Panel title="Recent Activity Timeline" subtitle="Latest analyst, detection, and hunting actions">
                  <div className="space-y-0">
                    {overview.recent_activity.length ? overview.recent_activity.map((item, index) => (
                      <div key={item.id} className="relative grid grid-cols-[20px_1fr_auto] gap-3 pb-5">
                        {index < overview.recent_activity.length - 1 ? <span className="absolute left-[6px] top-4 h-full w-px bg-slate-200" /> : null}
                        <span className="relative mt-1.5 h-3 w-3 rounded-full bg-cyan-600 ring-4 ring-cyan-50" />
                        <div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.title}</p><span className="text-xs text-slate-400">{item.activity_type}</span></div><p className="mt-1 text-sm text-slate-500">{item.detail}</p></div>
                        <div className="text-right"><Severity value={item.severity} /><p className="mt-2 text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</p></div>
                      </div>
                    )) : <p className="text-sm text-slate-500">Activity appears after the first investigation, hunt, or generated rule.</p>}
                  </div>
                </Panel>

                <Panel title="Analytics Snapshot" subtitle="High-frequency operational signals">
                  <div className="space-y-5">
                    <div><p className="text-xs font-semibold uppercase text-slate-500">Common alert types</p>{overview.common_alert_types.length ? overview.common_alert_types.map((item) => <div key={item.label} className="mt-3 flex items-center justify-between text-sm"><span>{item.label}</span><strong>{item.value}</strong></div>) : <p className="mt-2 text-sm text-slate-400">No alert types recorded</p>}</div>
                    <div className="border-t border-slate-200 pt-4"><p className="text-xs font-semibold uppercase text-slate-500">Common IOC tags</p><div className="mt-3 flex flex-wrap gap-2">{overview.threat_intel_statistics.common_tags.length ? overview.threat_intel_statistics.common_tags.map((item) => <span key={item.label} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{item.label} · {item.value}</span>) : <span className="text-sm text-slate-400">No IOC tags recorded</span>}</div></div>
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-4"><div><p className="text-xs text-slate-500">Average hunt risk</p><p className="mt-1 text-2xl font-semibold">{overview.hunting_statistics.average_risk_score}</p></div><div><p className="text-xs text-slate-500">Intel enrichments</p><p className="mt-1 text-2xl font-semibold">{overview.threat_intel_statistics.total_enrichments}</p></div></div>
                  </div>
                </Panel>
              </section>

              <section className="mt-4 grid gap-4 xl:grid-cols-2">
                <Panel title="Latest Investigations">
                  <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="pb-3">Alert</th><th className="pb-3">Severity</th><th className="pb-3 text-right">Risk</th></tr></thead><tbody>{overview.latest_investigations.map((item) => <tr key={item.id} className="border-b border-slate-100 last:border-0"><td className="py-3"><p className="font-medium">{item.title}</p><p className="text-xs text-slate-400">{item.event_type}</p></td><td className="py-3"><Severity value={item.severity} /></td><td className="py-3 text-right font-semibold">{item.risk_score}</td></tr>)}</tbody></table>{!overview.latest_investigations.length ? <p className="py-4 text-sm text-slate-400">No investigations yet</p> : null}</div>
                </Panel>
                <Panel title="Latest Detection Rules">
                  <div className="space-y-3">{overview.latest_detection_rules.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0"><div><p className="font-medium">{item.title}</p><p className="mt-1 text-xs text-slate-400">{item.mitre_ids.join(", ") || "No MITRE mapping"}</p></div><Severity value={item.severity} /></div>)}{!overview.latest_detection_rules.length ? <p className="text-sm text-slate-400">No detection rules yet</p> : null}</div>
                </Panel>
                <Panel title="Latest Hunts">
                  <div className="space-y-3">{overview.latest_hunts.map((item) => <div key={item.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-slate-100 pb-3 last:border-0"><div><p className="font-medium">{item.hunt_name}</p><p className="text-xs capitalize text-slate-400">{item.hunt_type}</p></div><Severity value={item.severity} /><strong>{item.risk_score}</strong></div>)}{!overview.latest_hunts.length ? <p className="text-sm text-slate-400">No threat hunts yet</p> : null}</div>
                </Panel>
                <Panel title="Recent Threat Intelligence">
                  <div className="space-y-3">{overview.recent_threat_intel.slice(0, 5).map((item, index) => <div key={`${item.indicator}-${index}`} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-100 pb-3 last:border-0"><div><p className="font-mono text-sm font-semibold">{item.indicator}</p><p className="mt-1 text-xs text-slate-400">{item.indicator_type.toUpperCase()} · {item.reputation}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">Risk {item.risk_score}</span></div>)}{!overview.recent_threat_intel.length ? <p className="text-sm text-slate-400">No enriched indicators yet</p> : null}</div>
                </Panel>
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
