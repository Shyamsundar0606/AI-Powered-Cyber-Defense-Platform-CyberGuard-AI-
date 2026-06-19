"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";

import { loginUser, saveAuthSession } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setServerError(new URLSearchParams(window.location.search).has("error"));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitLogin();
  }

  async function submitLogin() {
    if (isSubmitting) {
      return;
    }

    setError("");
    setStatus("Signing in...");

    if (!email.trim() || password.length < 8) {
      setStatus("");
      setError("Enter a valid email and password with at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const auth = await loginUser({ email: email.trim().toLowerCase(), password });
      saveAuthSession(auth);
      setStatus("Signed in. Opening dashboard...");
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setStatus("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-slate-100">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-cyan-950/30">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-300 text-slate-950">
            <ShieldCheck size={24} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Sign in</h1>
            <p className="text-sm text-slate-400">Access the CyberGuard AI dashboard.</p>
          </div>
        </div>

        <form action="/api/auth/login" className="space-y-5" method="post" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-200">
            Email
            <input
              className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-200">
            Password
            <input
              className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          {status ? <p className="rounded-md bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">{status}</p> : null}
          {serverError ? (
            <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              Login failed. Check the email and password.
            </p>
          ) : null}
          {error ? <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

          <button
            className="flex w-full items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            <LogIn size={18} aria-hidden="true" />
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          New to CyberGuard AI?{" "}
          <Link className="font-semibold text-cyan-200 hover:text-cyan-100" href="/register">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
