"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";

import { registerUser, saveAuthSession, UserRole } from "@/lib/auth";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setServerError(new URLSearchParams(window.location.search).has("error"));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitRegistration();
  }

  async function submitRegistration() {
    if (isSubmitting) {
      return;
    }

    setError("");
    setStatus("Creating account...");

    if (!email.trim() || !username.trim() || password.length < 8) {
      setStatus("");
      setError("Enter a valid email, username, and password with at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const auth = await registerUser({
        email: email.trim().toLowerCase(),
        username: username.trim(),
        password,
        role,
      });
      saveAuthSession(auth);
      setStatus("Account created. Opening dashboard...");
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
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
            <h1 className="text-xl font-semibold">Create account</h1>
            <p className="text-sm text-slate-400">Register for the CyberGuard AI MVP.</p>
          </div>
        </div>

        <form action="/api/auth/register" className="space-y-5" method="post" onSubmit={handleSubmit}>
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
            Username
            <input
              className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
              type="text"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              minLength={3}
              maxLength={80}
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
              maxLength={128}
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-200">
            Role
            <select
              className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          {status ? <p className="rounded-md bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">{status}</p> : null}
          {serverError ? (
            <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              Registration failed. The email or username may already exist.
            </p>
          ) : null}
          {error ? <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

          <button
            className="flex w-full items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            <UserPlus size={18} aria-hidden="true" />
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already registered?{" "}
          <Link className="font-semibold text-cyan-200 hover:text-cyan-100" href="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
