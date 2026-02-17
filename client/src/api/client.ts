const BASE_URL = import.meta.env.VITE_API_URL || "";

let adminToken: string | null = null;

export function setAdminToken(token: string | null) {
  adminToken = token;
}

export function getAdminToken() {
  return adminToken;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (adminToken) {
    headers["Authorization"] = `Bearer ${adminToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers,
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
