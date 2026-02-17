import { useState, useRef } from "react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { BEZIRKE, EVENT_TYPES } from "../../config/constants";
import { parseImport, saveImport } from "../../api/events";

interface ParsedEvent {
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time?: string;
  address: string;
  bezirk: string;
  kiez?: string;
  latitude?: number;
  longitude?: number;
  event_type: string;
  energy_score: number;
  social_score: number;
  source?: string;
  url?: string;
  _include: boolean;
  _confidence: "high" | "medium" | "low";
  _notes: string;
}

type Step = "input" | "loading" | "review" | "done";
type SourceType = "csv" | "json" | "text" | "url" | "pdf";

interface Props {
  onDone: () => void;
}

const SOURCE_OPTIONS: { type: SourceType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "csv", label: "CSV" },
  { type: "json", label: "JSON" },
  { type: "url", label: "URL" },
  { type: "pdf", label: "PDF" },
];

const CONFIDENCE_COLORS: Record<string, "accent" | "secondary" | "primary"> = {
  high: "accent",
  medium: "secondary",
  low: "primary",
};

export function EventImport({ onDone }: Props) {
  const [step, setStep] = useState<Step>("input");
  const [sourceType, setSourceType] = useState<SourceType>("text");
  const [content, setContent] = useState("");
  const [events, setEvents] = useState<ParsedEvent[]>([]);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<{ inserted: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (sourceType === "pdf") {
      // Read PDF as base64
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the data:application/pdf;base64, prefix
        const base64 = result.split(",")[1];
        setContent(base64);
      };
      reader.readAsDataURL(file);
    } else {
      // Read CSV/JSON as text
      const text = await file.text();
      setContent(text);
    }
  };

  const handleParse = async () => {
    if (!content.trim()) {
      setError("Please enter some content to parse");
      return;
    }
    setError(null);
    setStep("loading");

    try {
      const result = await parseImport({ source_type: sourceType, content });
      setEvents(result.events.map((e: ParsedEvent) => ({ ...e, _include: e._include ?? true })));
      setSummary(result.source_summary);
      setStep(result.events.length > 0 ? "review" : "input");
      if (result.events.length === 0) {
        setError("No events found in the input. Try different content or format.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse");
      setStep("input");
    }
  };

  const handleSave = async () => {
    const toSave = events
      .filter((e) => e._include)
      .map(({ _include, _confidence, _notes, ...rest }) => ({
        ...rest,
        source: rest.source || "import",
      }));

    if (toSave.length === 0) {
      setError("No events selected to save");
      return;
    }

    setError(null);
    try {
      const result = await saveImport({ events: toSave });
      setSaveResult({ inserted: result.inserted, failed: result.failed.length });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const toggleAll = (include: boolean) => {
    setEvents((prev) => prev.map((e) => ({ ...e, _include: include })));
  };

  const updateEvent = (index: number, field: string, value: string | number | boolean) => {
    setEvents((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
    );
  };

  const selectedCount = events.filter((e) => e._include).length;

  const inputClass =
    "w-full px-3 py-2 rounded-xl border border-gray-200 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  // ── Step 1: Input ──
  if (step === "input") {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Import Events</h3>

        {/* Source type selector */}
        <div className="flex gap-2 flex-wrap">
          {SOURCE_OPTIONS.map(({ type, label }) => (
            <Button
              key={type}
              size="sm"
              variant={sourceType === type ? "primary" : "secondary"}
              onClick={() => {
                setSourceType(type);
                setContent("");
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Input area */}
        {sourceType === "url" ? (
          <input
            type="url"
            placeholder="https://example.com/events"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={inputClass}
          />
        ) : sourceType === "pdf" ? (
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className={inputClass}
            />
            {content && (
              <p className="text-xs text-text-light">
                PDF loaded ({Math.round(content.length * 0.75 / 1024)} KB)
              </p>
            )}
          </div>
        ) : sourceType === "csv" || sourceType === "json" ? (
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept={sourceType === "csv" ? ".csv" : ".json"}
              onChange={handleFileChange}
              className={inputClass}
            />
            <textarea
              placeholder={
                sourceType === "csv"
                  ? "Or paste CSV content here...\ntitle,date,time,address,district\nJazz Night,2026-02-20,20:00,Oranienstr 190,Kreuzberg"
                  : 'Or paste JSON here...\n[{"title": "Jazz Night", "date": "2026-02-20", ...}]'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`${inputClass} h-40 resize-none font-mono text-xs`}
            />
          </div>
        ) : (
          <textarea
            placeholder="Paste event information here...&#10;&#10;Example: Jazz night at SO36, Oranienstr 190, Kreuzberg, Feb 20 at 9pm. Live bands and DJs."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`${inputClass} h-40 resize-none`}
          />
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button onClick={handleParse} disabled={!content.trim()}>
          Parse Events
        </Button>
      </div>
    );
  }

  // ── Step 2: Loading ──
  if (step === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-lg font-semibold">Parsing events with AI...</p>
        <p className="text-sm text-text-light">This may take 10-30 seconds</p>
      </div>
    );
  }

  // ── Step 3: Review ──
  if (step === "review") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Review Events</h3>
          <p className="text-sm text-text-light">{summary}</p>
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{selectedCount} of {events.length} selected</span>
          <Button size="sm" variant="secondary" onClick={() => toggleAll(true)}>
            Select All
          </Button>
          <Button size="sm" variant="secondary" onClick={() => toggleAll(false)}>
            Deselect All
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setStep("input");
              setEvents([]);
            }}
          >
            Back
          </Button>
        </div>

        {/* Event cards */}
        <div className="space-y-3">
          {events.map((event, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border transition-all ${
                event._include
                  ? "border-gray-200 bg-surface"
                  : "border-gray-100 bg-gray-50 opacity-60"
              }`}
            >
              {/* Row 1: checkbox, title, confidence */}
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  checked={event._include}
                  onChange={(e) => updateEvent(i, "_include", e.target.checked)}
                  className="accent-primary cursor-pointer shrink-0"
                />
                <input
                  value={event.title}
                  onChange={(e) => updateEvent(i, "title", e.target.value)}
                  className="flex-1 font-semibold text-sm bg-transparent border-b border-transparent hover:border-gray-200 focus:border-primary focus:outline-none py-0.5"
                />
                <Badge
                  label={event._confidence}
                  color={CONFIDENCE_COLORS[event._confidence]}
                />
              </div>

              {/* Row 2: date, time, address */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                <div>
                  <label className="text-xs text-text-light">Date</label>
                  <input
                    type="date"
                    value={event.date}
                    onChange={(e) => updateEvent(i, "date", e.target.value)}
                    className={`${inputClass} text-xs py-1`}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-light">Start</label>
                  <input
                    type="time"
                    value={event.start_time}
                    onChange={(e) => updateEvent(i, "start_time", e.target.value)}
                    className={`${inputClass} text-xs py-1`}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-text-light">Address</label>
                  <input
                    value={event.address}
                    onChange={(e) => updateEvent(i, "address", e.target.value)}
                    className={`${inputClass} text-xs py-1`}
                  />
                </div>
              </div>

              {/* Row 3: bezirk, type, scores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-xs text-text-light">Bezirk</label>
                  <select
                    value={event.bezirk}
                    onChange={(e) => updateEvent(i, "bezirk", e.target.value)}
                    className={`${inputClass} text-xs py-1`}
                  >
                    {BEZIRKE.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-light">Type</label>
                  <select
                    value={event.event_type}
                    onChange={(e) => updateEvent(i, "event_type", e.target.value)}
                    className={`${inputClass} text-xs py-1`}
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-light">Energy: {event.energy_score}</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={event.energy_score}
                    onChange={(e) => updateEvent(i, "energy_score", Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-light">Social: {event.social_score}</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={event.social_score}
                    onChange={(e) => updateEvent(i, "social_score", Number(e.target.value))}
                    className="w-full accent-secondary"
                  />
                </div>
              </div>

              {/* Notes */}
              {event._notes && (
                <p className="text-xs text-text-light mt-2 italic">{event._notes}</p>
              )}
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={selectedCount === 0}>
            Save {selectedCount} Event{selectedCount !== 1 ? "s" : ""}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setStep("input");
              setEvents([]);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 4: Done ──
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
        <span className="text-accent text-xl font-bold">✓</span>
      </div>
      <h3 className="text-lg font-bold">Import Complete</h3>
      {saveResult && (
        <p className="text-sm text-text-light">
          {saveResult.inserted} event{saveResult.inserted !== 1 ? "s" : ""} imported
          {saveResult.failed > 0 && `, ${saveResult.failed} failed`}
        </p>
      )}
      <div className="flex gap-3">
        <Button
          onClick={() => {
            setStep("input");
            setContent("");
            setEvents([]);
            setError(null);
            setSaveResult(null);
          }}
        >
          Import More
        </Button>
        <Button variant="secondary" onClick={onDone}>
          View Events
        </Button>
      </div>
    </div>
  );
}
