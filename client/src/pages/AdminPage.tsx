import { useState } from "react";
import { LoginForm } from "../components/admin/LoginForm";
import { Dashboard } from "../components/admin/Dashboard";
import { EventTable } from "../components/admin/EventTable";
import { EventForm } from "../components/admin/EventForm";
import { Button } from "../components/ui/Button";
import { useAdminAuth } from "../hooks/useAdminAuth";
import type { Event } from "../types";

type View = "dashboard" | "events" | "form";

export function AdminPage() {
  const { isAuthenticated, logout } = useAdminAuth();
  const [view, setView] = useState<View>("dashboard");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  if (!isAuthenticated) return <LoginForm />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <button onClick={logout} className="text-sm text-text-light hover:text-text cursor-pointer">
          Logout
        </button>
      </div>

      {/* Nav tabs */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={view === "dashboard" ? "primary" : "secondary"}
          onClick={() => setView("dashboard")}
        >
          Dashboard
        </Button>
        <Button
          size="sm"
          variant={view === "events" ? "primary" : "secondary"}
          onClick={() => setView("events")}
        >
          Events
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setEditingEvent(null);
            setView("form");
          }}
        >
          + New Event
        </Button>
      </div>

      {view === "dashboard" && <Dashboard />}
      {view === "events" && (
        <EventTable
          onEdit={(event) => {
            setEditingEvent(event);
            setView("form");
          }}
        />
      )}
      {view === "form" && (
        <EventForm
          event={editingEvent}
          onSaved={() => {
            setView("events");
            setEditingEvent(null);
          }}
          onCancel={() => {
            setView("events");
            setEditingEvent(null);
          }}
        />
      )}
    </div>
  );
}
