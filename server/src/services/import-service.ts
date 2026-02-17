import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { config } from "../config.js";
import { createEventSchema, type CreateEvent } from "../types/event.js";

const IS_MOCK = config.ANTHROPIC_API_KEY.startsWith("sk-ant-placeholder");
const client = IS_MOCK ? null : new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

const BEZIRKE = [
  "Mitte", "Kreuzberg", "Friedrichshain", "Neukölln", "Prenzlauer Berg",
  "Charlottenburg", "Schöneberg", "Wilmersdorf", "Treptow-Köpenick", "Pankow",
];

const EVENT_TYPES = [
  "Fitness/Sports", "Food & Drink", "Arts & Culture", "Music & Nightlife",
  "Shopping & Markets", "Networking", "Outdoors", "Wellness", "Workshops", "Community",
];

const IMPORT_SYSTEM_PROMPT = `You are an expert event data extractor for a Berlin day planner app. Extract structured event data from any input format (CSV, JSON, free text, HTML, PDF content).

For each event you find, return a JSON object with these fields:
- title (string, required): event name
- description (string, optional): brief description
- date (string, required): YYYY-MM-DD format. Today is ${new Date().toISOString().slice(0, 10)}. Resolve relative dates like "this Saturday", "next Friday", "tomorrow" relative to today.
- start_time (string, required): HH:MM 24h format
- end_time (string, optional): HH:MM 24h format
- address (string, required): street address in Berlin
- bezirk (string, required): must be one of: ${BEZIRKE.join(", ")}. Infer from address/venue/neighborhood using your Berlin geography knowledge.
- kiez (string, optional): sub-neighborhood if known
- latitude (number, optional): if available
- longitude (number, optional): if available
- event_type (string, required): must be one of: ${EVENT_TYPES.join(", ")}. Infer from event description/title.
- energy_score (integer 1-5, required): 1=very calm/passive, 2=relaxed, 3=moderate, 4=active/energetic, 5=intense/high-energy
- social_score (integer 1-5, required): 1=solo/introspective, 2=small/intimate, 3=moderate group, 4=social/interactive, 5=large crowd/party
- source (string, optional): where the event came from (URL, filename, etc.)
- url (string, optional): event URL if available
- _confidence ("high" | "medium" | "low"): how confident you are in the extracted data
- _notes (string): any notes about assumptions made or missing data

Scoring guide:
- Energy 1: meditation, reading, gallery viewing
- Energy 2: casual dining, walking tour, workshop
- Energy 3: live music, cooking class, market browsing
- Energy 4: dancing, sports, hiking
- Energy 5: rave, competitive sports, intense workout

- Social 1: solo activity, self-guided tour
- Social 2: pair activity, small workshop
- Social 3: medium group, class, meetup
- Social 4: social gathering, party, group activity
- Social 5: large festival, crowd event, networking

Respond ONLY with valid JSON (no markdown fences, no explanation) in this format:
{
  "events": [...],
  "source_summary": "Brief description of what was parsed"
}

If no events can be extracted, return: { "events": [], "source_summary": "No events found in the input" }`;

const CLASSIFY_SYSTEM_PROMPT = `You classify Berlin events. For each event, assign:
- bezirk: one of ${BEZIRKE.join(", ")}. Infer from address/coordinates using Berlin geography.
- event_type: one of ${EVENT_TYPES.join(", ")}. Infer from title/description.
- energy_score: 1-5 (1=calm, 3=moderate, 5=intense)
- social_score: 1-5 (1=solo, 3=medium group, 5=large crowd)

Respond ONLY with valid JSON array (no markdown fences):
[{ "index": 0, "bezirk": "...", "event_type": "...", "energy_score": 3, "social_score": 3 }, ...]`;

export const parseRequestSchema = z.object({
  source_type: z.enum(["csv", "json", "text", "url", "pdf"]),
  content: z.string().min(1).max(500_000),
});

export type ParseRequest = z.infer<typeof parseRequestSchema>;

export const parsedEventSchema = createEventSchema.extend({
  _include: z.boolean().default(true),
  _confidence: z.enum(["high", "medium", "low"]).default("medium"),
  _notes: z.string().default(""),
});

export type ParsedEvent = z.infer<typeof parsedEventSchema>;

export interface ParseResult {
  events: ParsedEvent[];
  source_summary: string;
}

export const saveRequestSchema = z.object({
  events: z.array(createEventSchema).min(1).max(100),
});

async function fetchUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "JoloBerlinPlanner/1.0" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
  const html = await res.text();
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100_000);
}

function buildMockResult(content: string): ParseResult {
  const now = new Date();
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7 || 7));
  const dateStr = nextFriday.toISOString().slice(0, 10);

  return {
    events: [
      {
        title: "Mock Imported Event — Jazz Night",
        description: "A cozy jazz evening in Kreuzberg. (Mock — no API key configured)",
        date: dateStr,
        start_time: "20:00",
        end_time: "23:00",
        address: "Oranienstraße 25, Berlin",
        bezirk: "Kreuzberg",
        kiez: "Oranienplatz",
        event_type: "Music & Nightlife",
        energy_score: 3,
        social_score: 3,
        source: "import",
        _include: true,
        _confidence: "high" as const,
        _notes: "Mock event — configure ANTHROPIC_API_KEY for real parsing",
      },
    ],
    source_summary: `Mock parse of ${content.length} characters (API key not configured)`,
  };
}

// ── Fast path: structured JSON with known fields ──
function tryParseStructuredJson(content: string): ParsedEvent[] | null {
  let arr: unknown[];
  try {
    const parsed = JSON.parse(content);
    arr = Array.isArray(parsed) ? parsed : null!;
  } catch {
    return null;
  }
  if (!arr || arr.length === 0) return null;

  // Check if entries have recognizable fields (start_date or date, title)
  const first = arr[0] as Record<string, unknown>;
  if (!first.title || (!first.start_date && !first.date)) return null;

  return arr.map((raw) => {
    const e = raw as Record<string, unknown>;

    // Parse date/time from ISO or date string
    let date = "";
    let startTime = "12:00";
    let endTime: string | undefined;

    if (e.start_date && typeof e.start_date === "string") {
      const d = new Date(e.start_date);
      date = d.toISOString().slice(0, 10);
      startTime = d.toISOString().slice(11, 16);
    } else if (e.date && typeof e.date === "string") {
      date = String(e.date).slice(0, 10);
    }

    if (e.end_date && typeof e.end_date === "string") {
      endTime = new Date(e.end_date).toISOString().slice(11, 16);
    } else if (e.end_time && typeof e.end_time === "string") {
      endTime = String(e.end_time).slice(0, 5);
    }

    if (e.start_time && typeof e.start_time === "string") {
      startTime = String(e.start_time).slice(0, 5);
    }

    // Build address from available fields
    const address = String(
      e.full_address || e.address || e.venue_name || "Berlin",
    ).replace(/,\s*Germany$/i, "");

    return {
      title: String(e.title || "Unknown Event"),
      description: e.description ? String(e.description).slice(0, 1000) : undefined,
      date,
      start_time: startTime,
      end_time: endTime,
      address: address || "Berlin",
      bezirk: "Mitte", // placeholder — classified by Claude or user
      event_type: "Community", // placeholder — classified by Claude or user
      energy_score: 3,
      social_score: 3,
      latitude: typeof e.latitude === "number" ? e.latitude : undefined,
      longitude: typeof e.longitude === "number" ? e.longitude : undefined,
      source: e.platform ? String(e.platform) : "import",
      url: e.url ? String(e.url) : undefined,
      _include: true,
      _confidence: "medium" as const,
      _notes: "",
    };
  });
}

// Use Claude to classify events in a batch (bezirk, type, scores)
async function classifyEvents(events: ParsedEvent[]): Promise<ParsedEvent[]> {
  if (IS_MOCK || !client || events.length === 0) return events;

  // Build a compact summary for classification
  const summary = events.map((e, i) => ({
    index: i,
    title: e.title,
    address: e.address,
    lat: e.latitude,
    lng: e.longitude,
    description: (e.description || "").slice(0, 100),
  }));

  // Process in batches of 20 to avoid timeouts
  const BATCH_SIZE = 20;
  const classified = [...events];

  for (let start = 0; start < summary.length; start += BATCH_SIZE) {
    const batch = summary.slice(start, start + BATCH_SIZE);

    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: CLASSIFY_SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: `Classify these ${batch.length} Berlin events:\n${JSON.stringify(batch)}`,
        }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "[]";
      const results = JSON.parse(text) as {
        index: number;
        bezirk: string;
        event_type: string;
        energy_score: number;
        social_score: number;
      }[];

      for (const r of results) {
        const globalIndex = start + r.index;
        if (globalIndex < classified.length) {
          if (BEZIRKE.includes(r.bezirk)) classified[globalIndex].bezirk = r.bezirk;
          if (EVENT_TYPES.includes(r.event_type)) classified[globalIndex].event_type = r.event_type;
          if (r.energy_score >= 1 && r.energy_score <= 5) classified[globalIndex].energy_score = r.energy_score;
          if (r.social_score >= 1 && r.social_score <= 5) classified[globalIndex].social_score = r.social_score;
          classified[globalIndex]._confidence = "high";
        }
      }
    } catch (err) {
      console.error(`Classification batch failed (offset ${start}):`, err);
      // Keep defaults — user can fix in review step
    }
  }

  return classified;
}

export async function parseImportContent(req: ParseRequest): Promise<ParseResult> {
  let textContent = req.content;
  const isPdf = req.source_type === "pdf";

  // For URLs, fetch the page content
  if (req.source_type === "url") {
    textContent = await fetchUrl(req.content);
  }

  if (IS_MOCK || !client) {
    console.log("Using mock import parser (no API key configured)");
    return buildMockResult(textContent);
  }

  // Fast path: structured JSON — map fields directly, classify with Claude
  if (req.source_type === "json") {
    const directEvents = tryParseStructuredJson(textContent);
    if (directEvents && directEvents.length > 0) {
      console.log(`Fast path: mapped ${directEvents.length} structured JSON events`);
      const classified = await classifyEvents(directEvents);
      return {
        events: classified,
        source_summary: `Mapped ${classified.length} events from structured JSON`,
      };
    }
  }

  // Full Claude parse for unstructured content (text, CSV, URL, PDF)
  const userContent: Anthropic.Messages.ContentBlockParam[] = [];

  if (isPdf) {
    userContent.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: textContent,
      },
    });
    userContent.push({
      type: "text",
      text: "Extract all events from this PDF document.",
    });
  } else {
    userContent.push({
      type: "text",
      text: `Extract events from the following ${req.source_type} input:\n\n${textContent}`,
    });
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: IMPORT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  let parsed: { events: unknown[]; source_summary: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Failed to parse Claude response as JSON");
  }

  const events: ParsedEvent[] = [];
  for (const raw of parsed.events) {
    const obj = raw as Record<string, unknown>;
    obj._include = obj._include ?? true;
    obj._confidence = obj._confidence ?? "medium";
    obj._notes = obj._notes ?? "";
    obj.source = obj.source ?? "import";

    const result = parsedEventSchema.safeParse(obj);
    if (result.success) {
      events.push(result.data);
    } else {
      events.push({
        title: String(obj.title || "Unknown Event"),
        date: String(obj.date || new Date().toISOString().slice(0, 10)),
        start_time: String(obj.start_time || "12:00"),
        address: String(obj.address || "Berlin"),
        bezirk: BEZIRKE.includes(String(obj.bezirk)) ? String(obj.bezirk) : "Mitte",
        event_type: EVENT_TYPES.includes(String(obj.event_type)) ? String(obj.event_type) : "Community",
        energy_score: Number(obj.energy_score) || 3,
        social_score: Number(obj.social_score) || 3,
        source: String(obj.source || "import"),
        _include: true,
        _confidence: "low",
        _notes: `Validation issues: ${result.error.errors.map((e) => e.message).join(", ")}`,
      });
    }
  }

  return {
    events,
    source_summary: parsed.source_summary || `Parsed ${events.length} events`,
  };
}
