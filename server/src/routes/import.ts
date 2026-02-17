import { Router } from "express";
import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  parseRequestSchema,
  saveRequestSchema,
  parseImportContent,
} from "../services/import-service.js";
import { createEventSchema } from "../types/event.js";
import * as eventService from "../services/event-service.js";

export const importRouter = Router();

// Large body limit for PDF imports (base64)
importRouter.use(express.json({ limit: "10mb" }));

// Parse input into event candidates
importRouter.post("/parse", requireAdmin, validate(parseRequestSchema), async (req, res) => {
  const result = await parseImportContent(req.body);
  res.json(result);
});

// Bulk insert reviewed events — valid ones are saved normally, invalid ones as drafts (is_active=false)
importRouter.post("/save", requireAdmin, validate(saveRequestSchema), async (req, res) => {
  const { events } = req.body;

  let inserted = 0;
  let drafts = 0;
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < events.length; i++) {
    const raw = events[i];
    const result = createEventSchema.safeParse(raw);

    if (result.success) {
      // Valid event — save normally
      try {
        await eventService.createEvent(result.data);
        inserted++;
      } catch (err) {
        errors.push({ index: i, error: err instanceof Error ? err.message : "DB error" });
      }
    } else {
      // Invalid event — try to fix and save as draft
      try {
        const fixed = autoFixEvent(raw);
        await eventService.createEventAsDraft(fixed);
        drafts++;
      } catch (err) {
        errors.push({ index: i, error: err instanceof Error ? err.message : "Draft save failed" });
      }
    }
  }

  res.json({ inserted, drafts, failed: errors });
});

/** Best-effort fix for events that don't pass strict validation */
function autoFixEvent(raw: Record<string, unknown>) {
  const today = new Date().toISOString().slice(0, 10);

  let date = today;
  if (typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)) {
    date = raw.date;
  }

  let startTime = "12:00";
  if (typeof raw.start_time === "string" && /^\d{2}:\d{2}$/.test(raw.start_time)) {
    startTime = raw.start_time;
  }

  let endTime: string | undefined;
  if (typeof raw.end_time === "string" && /^\d{2}:\d{2}$/.test(raw.end_time)) {
    endTime = raw.end_time;
  }

  return {
    title: String(raw.title || "Untitled Event").slice(0, 255),
    description: raw.description ? String(raw.description) : undefined,
    date,
    start_time: startTime,
    end_time: endTime,
    address: String(raw.address || "Berlin").slice(0, 500),
    bezirk: String(raw.bezirk || "Mitte").slice(0, 100),
    kiez: raw.kiez ? String(raw.kiez).slice(0, 100) : undefined,
    latitude: typeof raw.latitude === "number" ? raw.latitude : undefined,
    longitude: typeof raw.longitude === "number" ? raw.longitude : undefined,
    event_type: String(raw.event_type || "Community").slice(0, 100),
    energy_score: Math.min(5, Math.max(1, Number(raw.energy_score) || 3)),
    social_score: Math.min(5, Math.max(1, Number(raw.social_score) || 3)),
    source: raw.source ? String(raw.source).slice(0, 255) : "import-draft",
    url: typeof raw.url === "string" && raw.url.startsWith("http") ? raw.url.slice(0, 500) : undefined,
  };
}
