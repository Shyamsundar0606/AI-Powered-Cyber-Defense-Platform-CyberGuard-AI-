"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity, BrainCircuit, Check, Clipboard, Download, FileCode2, FileText,
  LayoutDashboard, LogOut, Printer, Radar, Search, ShieldCheck,
} from "lucide-react";

import { clearAuthSession, getAuthToken, getStoredUser, type AuthUser } from "@/lib/auth";
import { fetchExecutiveReport, type ExecutiveReport } from "@/lib/dashboard";

const navItems = [
  ["Overview", "/dashboard", LayoutDashboard],
  ["SOC Analyst", "/dashboard/soc-analyst", BrainCircuit],
  ["Threat Intelligence", "/dashboard/threat-intel", Radar],
  ["MITRE Knowledge Base", "/dashboard/mitre", Activity],
  ["Detection Engineering", "/dashboard/detection-engineering", FileCode2],
  ["Threat Hunting", "/dashboard/threat-hunting", Search],
  ["Executive Reports", "/dashboard/reports", FileText],
] as const;

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setUser(getStoredUser());
    fetchExecutiveReport(token)
      .then(setReport)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to generate report."));
  }, [router]);

  function logout() {
    clearAuthSession();
    router.replace("/login");
  }

  function downloadReport() {
    if (!report) return;
    const blob = new Blob([report.report_markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cyberguard-executive-report-${report.generated_at.slice(0, 10)}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copyReport() {
    if (!report) return;
    await navigator.clipboard.writeText(report.report_markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-800 bg-slate-950 px-5 py-6 text-slate-100 print:hidden">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-300 text-slate-950"><ShieldCheck size={22} /></span>
            <div><p className="font-semibold">CyberGuard AI</p><p className="text-xs text-slate-400">Security Operations Center</p></div>
          </div>
          <nav className="space-y-1">
            {navItems.map(([label, href, Icon]) => (
              <Link key={href} href={href} className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm ${href === "/dashboard/reports" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
                <Icon size={18} />{label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="px-5 py-6 lg:px-8">
          <header className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between print:mb-4">
            <div><h1 className="text-3xl font-semibold">Executive Reports</h1><p className="mt-2 text-sm text-slate-500 print:hidden">Generate executive-ready security reports and operational summaries.</p></div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <button onClick={copyReport} disabled={!report} className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50">{copied ? <Check size={16} /> : <Clipboard size={16} />}{copied ? "Copied" : "Copy"}</button>
              <button onClick={downloadReport} disabled={!report} className="flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><Download size={16} />Download Markdown</button>
              <button onClick={() => window.print()} disabled={!report} className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"><Printer size={16} />Print</button>
              {user ? <button onClick={logout} className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"><LogOut size={16} />Logout</button> : null}
            </div>
          </header>

          {error ? <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}
          {!report && !error ? <div className="rounded-md border border-slate-200 bg-white p-6 text-slate-600">Generating report from SQLite records...</div> : null}
          {report ? (
            <article className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none">
              <p className="mb-5 text-sm text-slate-500">Generated {new Date(report.generated_at).toLocaleString()}</p>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-800">{report.report_markdown}</pre>
            </article>
          ) : null}
        </section>
      </div>
    </main>
  );
}
