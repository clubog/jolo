import { useState } from "react";
import { Button } from "../ui/Button";
import { BEZIRKE, EVENT_TYPES } from "../../config/constants";
import { createEvent, updateEvent } from "../../api/events";
import type { Event } from "../../types";

interface Props {
  event?: Event | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function EventForm({ event, onSaved, onCancel }: Props) {
  const [form, setForm] = useState({
    title: event?.title || "",
    description: event?.description || "",
    date: event?.date || new Date().toISOString().slice(0, 10),
    start_time: event?.start_time?.slice(0, 5) || "10:00",
    end_time: event?.end_time?.slice(0, 5) || "",
    address: event?.address || "",
    bezirk: event?.bezirk || BEZIRKE[0],
    kiez: event?.kiez || "",
    event_type: event?.event_type || EVENT_TYPES[0],
    energy_score: event?.energy_score || 3,
    social_score: event?.social_score || 3,
    source: event?.source || "",
    url: event?.url || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = {
        ...form,
        end_time: form.end_time || undefined,
        kiez: form.kiez || undefined,
        source: form.source || undefined,
        url: form.url || undefined,
      };
      if (event) {
        await updateEvent(event.id, data);
      } else {
        await createEvent(data);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-xl border border-gray-200 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold">
        {event ? "Edit Event" : "Create Event"}
      </h3>

      <input
        placeholder="Title *"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        className={inputClass}
        required
      />

      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        className={`${inputClass} h-20 resize-none`}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-light">Date *</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="text-xs text-text-light">Start Time *</label>
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => set("start_time", e.target.value)}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-light">End Time</label>
          <input
            type="time"
            value={form.end_time}
            onChange={(e) => set("end_time", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-text-light">Kiez</label>
          <input
            placeholder="e.g. Wrangelkiez"
            value={form.kiez}
            onChange={(e) => set("kiez", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <input
        placeholder="Address *"
        value={form.address}
        onChange={(e) => set("address", e.target.value)}
        className={inputClass}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-light">District *</label>
          <select
            value={form.bezirk}
            onChange={(e) => set("bezirk", e.target.value)}
            className={inputClass}
          >
            {BEZIRKE.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-text-light">Event Type *</label>
          <select
            value={form.event_type}
            onChange={(e) => set("event_type", e.target.value)}
            className={inputClass}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-light">
            Energy Score: {form.energy_score} / 5
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={form.energy_score}
            onChange={(e) => set("energy_score", Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-text-light">
            <span>Very Calm</span>
            <span>Very Energetic</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-text-light">
            Social Score: {form.social_score} / 5
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={form.social_score}
            onChange={(e) => set("social_score", Number(e.target.value))}
            className="w-full accent-secondary"
          />
          <div className="flex justify-between text-xs text-text-light">
            <span>Solo/Quiet</span>
            <span>Highly Social</span>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
