import type { ReactNode } from "react";
import { Header } from "./Header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
