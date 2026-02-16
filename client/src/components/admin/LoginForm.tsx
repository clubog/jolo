import { useState } from "react";
import { Button } from "../ui/Button";
import { useAdminAuth } from "../../hooks/useAdminAuth";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const { login, error } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(password);
  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={!password}>
          Login
        </Button>
      </form>
    </div>
  );
}
