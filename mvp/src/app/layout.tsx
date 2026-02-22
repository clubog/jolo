import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JOLO MVP — Berlin Event Planner",
  description: "Personalized event scheduling for Berlin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-app-bg text-ink font-sans min-h-screen">
        <nav className="border-b border-border bg-surface">
          <div className="max-w-[390px] mx-auto px-4 py-3 flex items-center gap-6">
            <a href="/" className="font-display text-lg">JOLO</a>
            <a href="/plan" className="text-sm text-ink-light hover:text-terracotta transition-colors">Plan</a>
            <a href="/admin" className="text-sm text-ink-light hover:text-terracotta transition-colors">Admin</a>
          </div>
        </nav>
        <main className="max-w-[390px] mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
