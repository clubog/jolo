import { api } from "./client";

export function adminLogin(password: string): Promise<{ ok: boolean }> {
  return api.post("/api/admin/login", { password });
}
