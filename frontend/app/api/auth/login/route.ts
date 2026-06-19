import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const detail = await response.text();
    const message = encodeURIComponent(detail || "Login failed.");
    return NextResponse.redirect(new URL(`/login?error=${message}`, request.url), 303);
  }

  const auth = await response.json();
  const redirect = NextResponse.redirect(new URL("/dashboard", request.url), 303);
  redirect.cookies.set("cyberguard_token", auth.access_token, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60,
  });
  redirect.cookies.set("cyberguard_user", encodeURIComponent(JSON.stringify(auth.user)), {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60,
  });
  return redirect;
}
