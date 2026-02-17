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
  // Strip HTML tags, keep text content
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

  // Build the message content
  const userContent: Anthropic.Messages.ContentBlockParam[] = [];

  if (isPdf) {
    // PDF: send as document content block (base64)
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

  // Validate and coerce each event, keeping _include/_confidence/_notes
  const events: ParsedEvent[] = [];
  for (const raw of parsed.events) {
    const obj = raw as Record<string, unknown>;
    // Set defaults for optional fields
    obj._include = obj._include ?? true;
    obj._confidence = obj._confidence ?? "medium";
    obj._notes = obj._notes ?? "";
    obj.source = obj.source ?? "import";

    const result = parsedEventSchema.safeParse(obj);
    if (result.success) {
      events.push(result.data);
    } else {
      // Try to include with relaxed validation — keep the raw data with notes
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
