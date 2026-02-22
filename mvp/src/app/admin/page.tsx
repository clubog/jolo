"use client";

import { useEffect, useState } from "react";

interface Event {
  id: string; title: string; date: string; startTime: string | null;
  district: string | null; venue: string | null; category: string;
  subtags: string; isActive: boolean;
}

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [jsonInput, setJsonInput] = useState("");
  const [importResult, setImportResult] = useState("");

  useEffect(() => {
    fetch("/api/events").then((r) => r.json()).then(setEvents);
  }, []);

  async function handleImport() {
    try {
      const parsed = JSON.parse(jsonInput);
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      setImportResult(`Imported ${data.imported} event(s)`);
      setJsonInput("");
      // Refresh
      const fresh = await fetch("/api/events").then((r) => r.json());
      setEvents(fresh);
    } catch {
      setImportResult("Invalid JSON");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-[28px]">Admin — Events</h1>

      {/* Import */}
      <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
        <h2 className="text-ink-light text-xs font-medium uppercase tracking-wide">Import Events (JSON)</h2>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder={`[{"title":"My Event","date":"2026-02-18","start_time":"19:00","district":"Mitte","category":"tech","subtags":["ai"]}]`}
          className="w-full border border-border rounded-xl px-3 py-2 text-sm font-mono h-32 focus:border-terracotta focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleImport}
            disabled={!jsonInput}
            className="px-4 py-2 bg-terracotta text-white rounded-full text-sm hover:bg-terracotta/90 disabled:opacity-40"
          >
            Import
          </button>
          {importResult && <span className="text-sm text-ink-light">{importResult}</span>}
        </div>
      </div>

      {/* Event List */}
      <div>
        <h2 className="text-ink-light text-xs font-medium uppercase tracking-wide mb-3">
          All Events ({events.length})
        </h2>
        <div className="overflow-x-auto bg-surface rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 px-3 font-medium">Date</th>
                <th className="py-2 px-3 font-medium">Time</th>
                <th className="py-2 px-3 font-medium">Title</th>
                <th className="py-2 px-3 font-medium">District</th>
                <th className="py-2 px-3 font-medium">Category</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-border/50">
                  <td className="py-2 px-3 font-mono text-xs">{e.date}</td>
                  <td className="py-2 px-3 font-mono text-xs">{e.startTime ?? "—"}</td>
                  <td className="py-2 px-3">{e.title}</td>
                  <td className="py-2 px-3 text-ink-light">{e.district ?? "—"}</td>
                  <td className="py-2 px-3">
                    <span className="text-xs bg-app-bg px-2 py-0.5 rounded-full">{e.category}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
