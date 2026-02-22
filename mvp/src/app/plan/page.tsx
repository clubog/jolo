"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// --------------- Types ---------------
interface ScoredEvent {
  id: string; title: string; date: string; startTime: string | null;
  endTime: string | null; district: string | null; venue: string | null;
  category: string; subtags: string[]; priceEurMin: number | null;
  priceEurMax: number | null; score: number; reasons: string[];
  tier: "primary" | "optional"; timeConflict?: boolean;
}
interface DayPlan { date: string; primary: ScoredEvent[]; optional: ScoredEvent[] }

// --------------- Constants ---------------
const PERSONA_PRESETS = [
  { key: "founder", label: "Founder / Builder" },
  { key: "creative", label: "Creative / Artist" },
  { key: "explorer", label: "Culture Explorer" },
  { key: "nightlife", label: "Nightlife / Party" },
  { key: "custom", label: "Custom" },
] as const;

const INTENTS = [
  { key: "network", label: "Network" },
  { key: "learn", label: "Learn" },
  { key: "explore", label: "Explore" },
  { key: "party", label: "Party" },
  { key: "recover", label: "Recover" },
] as const;

const ENERGIES = [
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
] as const;

const SOCIAL_MODES = [
  { key: "solo", label: "Solo" },
  { key: "small_group", label: "Small Group" },
  { key: "crowd", label: "Crowd" },
] as const;

const DISTRICTS = [
  "Mitte", "Kreuzberg", "Neukölln", "Friedrichshain",
  "Prenzlauer Berg", "Charlottenburg", "Schöneberg",
  "Wedding", "Tempelhof",
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// --------------- Session ID ---------------
function getSessionId(): string {
  if (typeof window === "undefined") return "anonymous";
  let id = localStorage.getItem("jolo_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("jolo_session_id", id);
  }
  return id;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return `${DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1]} ${dateStr.slice(8)}/${dateStr.slice(5, 7)}`;
}

// --------------- Chip Component ---------------
function Chip({ selected, onClick, children }: {
  selected: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
        selected
          ? "bg-terracotta text-white border-terracotta"
          : "border-border text-ink hover:border-terracotta"
      }`}
    >
      {children}
    </button>
  );
}

// --------------- Main Page ---------------
export default function PlanPage() {
  const sessionId = useRef(getSessionId());

  const [personaKey, setPersonaKey] = useState("explorer");
  const [intent, setIntent] = useState("explore");
  const [energy, setEnergy] = useState("medium");
  const [socialMode, setSocialMode] = useState("small_group");
  const [districtFocus, setDistrictFocus] = useState<string[]>([]);

  const [plan, setPlan] = useState<DayPlan[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "SAVE" | "HIDE">>({});

  // Load existing feedbacks on mount
  useEffect(() => {
    fetch("/api/feedback", {
      headers: { "x-session-id": sessionId.current },
    })
      .then((r) => r.json())
      .then((rows: { eventId: string; action: string }[]) => {
        const map: Record<string, "SAVE" | "HIDE"> = {};
        for (const r of rows) map[r.eventId] = r.action as "SAVE" | "HIDE";
        setFeedbackMap(map);
      })
      .catch(() => {});
  }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId.current,
        },
        body: JSON.stringify({ personaKey, intent, energy, socialMode, districtFocus }),
      });
      const data = await res.json();
      setPlan(data.plan);
    } finally {
      setLoading(false);
    }
  }, [personaKey, intent, energy, socialMode, districtFocus]);

  const sendFeedback = useCallback(async (eventId: string, action: "SAVE" | "HIDE") => {
    setFeedbackMap((prev) => ({ ...prev, [eventId]: action }));
    await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionId.current,
      },
      body: JSON.stringify({ event_id: eventId, action }),
    });
  }, []);

  function toggleDistrict(d: string) {
    setDistrictFocus((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="font-display text-[28px]">Plan Builder</h1>

      {/* Persona Preset */}
      <Section label="Who are you?">
        <div className="flex flex-wrap gap-2">
          {PERSONA_PRESETS.map((p) => (
            <Chip key={p.key} selected={personaKey === p.key} onClick={() => setPersonaKey(p.key)}>
              {p.label}
            </Chip>
          ))}
        </div>
      </Section>

      {/* Mood */}
      <Section label="Set Mood">
        <ChipRow label="Intent" items={INTENTS} value={intent} onChange={setIntent} />
        <ChipRow label="Energy" items={ENERGIES} value={energy} onChange={setEnergy} />
        <ChipRow label="Social" items={SOCIAL_MODES} value={socialMode} onChange={setSocialMode} />
      </Section>

      {/* District Focus */}
      <Section label="District Focus (optional)">
        <div className="flex flex-wrap gap-2">
          {DISTRICTS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDistrict(d)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                districtFocus.includes(d)
                  ? "bg-terracotta text-white border-terracotta"
                  : "border-border text-ink hover:border-terracotta"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </Section>

      <button
        onClick={generate}
        disabled={loading}
        className="w-full px-6 py-3 bg-terracotta text-white rounded-full font-semibold hover:bg-terracotta/90 disabled:opacity-40 transition"
      >
        {loading ? "Generating..." : "Generate Plan"}
      </button>

      {/* Results */}
      {plan && (
        <div className="space-y-8">
          <h2 className="font-display text-xl">Your Plan — Feb 16–22</h2>
          {plan.map((day) => (
            <div key={day.date}>
              <h3 className="font-semibold text-lg border-b border-border pb-2 mb-3">
                {formatDate(day.date)}
              </h3>

              {day.primary.length === 0 && day.optional.length === 0 && (
                <p className="text-sm text-ink-light">No events match your criteria for this day.</p>
              )}

              {day.primary.length > 0 && (
                <div className="space-y-3 mb-4">
                  {day.primary.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      feedback={feedbackMap[event.id]}
                      onFeedback={sendFeedback}
                    />
                  ))}
                </div>
              )}

              {day.optional.length > 0 && (
                <div>
                  <p className="text-ink-light text-xs font-medium uppercase tracking-wide mb-2">Also consider</p>
                  <div className="space-y-2">
                    {day.optional.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        feedback={feedbackMap[event.id]}
                        onFeedback={sendFeedback}
                        small
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --------------- Sub-components ---------------

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
      <h2 className="text-ink-light text-xs font-medium uppercase tracking-wide">{label}</h2>
      {children}
    </div>
  );
}

function ChipRow<T extends string>({ label, items, value, onChange }: {
  label: string;
  items: readonly { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="text-xs text-ink-light">{label}</label>
      <div className="flex flex-wrap gap-2 mt-1">
        {items.map((item) => (
          <Chip key={item.key} selected={value === item.key} onClick={() => onChange(item.key)}>
            {item.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function EventCard({
  event, feedback, onFeedback, small,
}: {
  event: ScoredEvent;
  feedback?: "SAVE" | "HIDE";
  onFeedback: (id: string, action: "SAVE" | "HIDE") => void;
  small?: boolean;
}) {
  const isHidden = feedback === "HIDE";

  return (
    <div className={`bg-surface rounded-2xl border p-4 shadow-sm ${isHidden ? "opacity-40" : ""} ${small ? "border-border/50" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono text-ink-light">
              {event.startTime ?? "All day"}
            </span>
            <span className="text-xs bg-app-bg text-ink-light px-2 py-0.5 rounded-full">
              {event.district ?? "District TBD"}
            </span>
            <span className="text-xs bg-app-bg text-ink-light px-2 py-0.5 rounded-full">
              {event.category}
            </span>
            {event.priceEurMin != null && (
              <span className="text-xs text-ink-light">
                {event.priceEurMin === 0
                  ? "Free"
                  : `€${event.priceEurMin}${event.priceEurMax && event.priceEurMax !== event.priceEurMin ? `–${event.priceEurMax}` : ""}`}
              </span>
            )}
            {event.timeConflict && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                Time conflict
              </span>
            )}
          </div>
          <h4 className={`font-semibold mt-1 ${small ? "text-sm" : ""}`}>{event.title}</h4>
          {event.venue && <p className="text-xs text-ink-light">{event.venue}</p>}
          <div className="mt-1.5 space-y-0.5">
            {event.reasons.map((r, i) => (
              <p key={i} className="text-xs text-ink-light">• {r}</p>
            ))}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onFeedback(event.id, "SAVE")}
            className={`px-2 py-1 rounded-full text-xs border transition-colors ${
              feedback === "SAVE"
                ? "bg-terracotta/10 border-terracotta text-terracotta"
                : "border-border hover:border-terracotta"
            }`}
            title="Save"
          >
            ★
          </button>
          <button
            onClick={() => onFeedback(event.id, "HIDE")}
            className={`px-2 py-1 rounded-full text-xs border transition-colors ${
              feedback === "HIDE"
                ? "bg-red-100 border-red-400 text-red-700"
                : "border-border hover:border-red-400"
            }`}
            title="Hide"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
