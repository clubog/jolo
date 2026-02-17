import { api, setAdminToken } from "./client";

export async function adminLogin(password: string): Promise<{ ok: boolean }> {
  const result = await api.post<{ ok: boolean; token: string }>("/api/admin/login", { password });
  if (result.token) {
    setAdminToken(result.token);
  }
  return result;
}

export function adminLogout() {
  setAdminToken(null);
}
