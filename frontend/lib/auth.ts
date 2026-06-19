import { apiRequest } from "./api";

const TOKEN_KEY = "cyberguard_token";
const USER_KEY = "cyberguard_user";

export type UserRole = "admin" | "user";

export type AuthUser = {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
};

export type ProtectedDashboardResponse = {
  message: string;
  user: AuthUser;
  modules: string[];
};

export type RegisterPayload = {
  email: string;
  username: string;
  password: string;
  role?: UserRole;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export function saveAuthSession(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
  document.cookie = `${TOKEN_KEY}=${auth.access_token}; path=/; max-age=3600; samesite=lax`;
  document.cookie = `${USER_KEY}=${encodeURIComponent(JSON.stringify(auth.user))}; path=/; max-age=3600; samesite=lax`;
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) ?? getCookie(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const user = localStorage.getItem(USER_KEY);
  const storedUser = user ?? getCookie(USER_KEY);
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(storedUser)) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; samesite=lax`;
  document.cookie = `${USER_KEY}=; path=/; max-age=0; samesite=lax`;
}

function getCookie(name: string) {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));
  return cookie?.split("=").slice(1).join("=");
}

export async function registerUser(payload: RegisterPayload) {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: LoginPayload) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchCurrentUser(token: string) {
  return apiRequest<AuthUser>("/api/auth/me", { method: "GET" }, token);
}

export async function fetchProtectedDashboard(token: string) {
  return apiRequest<ProtectedDashboardResponse>("/api/protected/dashboard", { method: "GET" }, token);
}
