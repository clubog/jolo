import { useState, useCallback, createContext, useContext } from "react";
import { adminLogin } from "../api/auth";

interface AdminAuthState {
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
}

export const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function useAdminAuthProvider(): AdminAuthState {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (password: string) => {
    setError(null);
    try {
      await adminLogin(password);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout, error };
}

export function useAdminAuth(): AdminAuthState {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthContext");
  return ctx;
}
