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
      bezirk: inferBezirk(e),
      event_type: inferEventType(String(e.title || ""), String(e.description || "")),
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

// ── Local heuristic classification (no API calls) ──

// Approximate Berlin bezirk boundaries by lat/lng
const BEZIRK_COORDS: { name: string; lat: number; lng: number }[] = [
  { name: "Mitte", lat: 52.520, lng: 13.405 },
  { name: "Kreuzberg", lat: 52.489, lng: 13.403 },
  { name: "Friedrichshain", lat: 52.516, lng: 13.454 },
  { name: "Neukölln", lat: 52.476, lng: 13.437 },
  { name: "Prenzlauer Berg", lat: 52.539, lng: 13.424 },
  { name: "Charlottenburg", lat: 52.516, lng: 13.304 },
  { name: "Schöneberg", lat: 52.484, lng: 13.349 },
  { name: "Wilmersdorf", lat: 52.487, lng: 13.318 },
  { name: "Treptow-Köpenick", lat: 52.459, lng: 13.498 },
  { name: "Pankow", lat: 52.568, lng: 13.413 },
];

// Address substrings that hint at a bezirk
const BEZIRK_ADDRESS_HINTS: Record<string, string[]> = {
  "Kreuzberg": ["kreuzberg", "kottbuss", "oranien", "skalitz", "görlitz", "bergmann", "graefe", "10997", "10999", "10961", "10963"],
  "Neukölln": ["neukölln", "sonnenallee", "hermannstr", "karl-marx-str", "weserstr", "richardstr", "12043", "12045", "12047", "12049", "12051", "12053", "12055"],
  "Friedrichshain": ["friedrichshain", "simon-dach", "boxhagener", "warschauer", "revaler", "raw ", "10243", "10245"],
  "Mitte": ["mitte", "alexanderplatz", "hackescher", "torstr", "rosenthaler", "unter den linden", "friedrichstr", "10115", "10117", "10119", "10178", "10179"],
  "Prenzlauer Berg": ["prenzlauer", "kastanienallee", "schönhauser", "stargarder", "helmholtz", "kollwitz", "mauerpark", "10405", "10407", "10409", "10435", "10437", "10439"],
  "Charlottenburg": ["charlottenburg", "savignyplatz", "kantstr", "kurfürstendamm", "ku'damm", "wilmersdorfer", "10585", "10587", "10589", "10623", "10625", "10627", "10629"],
  "Schöneberg": ["schöneberg", "nollendorf", "winterfeldt", "akazien", "goltzstr", "10777", "10779", "10781", "10783", "10785", "10787", "10789"],
  "Wilmersdorf": ["wilmersdorf", "ludwigkirch", "uhlandstr", "bundesplatz", "10707", "10709", "10711", "10713", "10715", "10717", "10719"],
  "Pankow": ["pankow", "florastr", "wollankstr", "13187", "13189"],
  "Treptow-Köpenick": ["treptow", "köpenick", "oberschöneweide", "12435", "12437", "12439"],
};

function inferBezirk(e: Record<string, unknown>): string {
  // Try address hints first
  const addr = String(e.full_address || e.address || "").toLowerCase();
  for (const [bezirk, hints] of Object.entries(BEZIRK_ADDRESS_HINTS)) {
    if (hints.some((h) => addr.includes(h))) return bezirk;
  }

  // Fall back to nearest coordinates
  const lat = typeof e.latitude === "number" ? e.latitude : null;
  const lng = typeof e.longitude === "number" ? e.longitude : null;
  if (lat && lng) {
    let nearest = "Mitte";
    let minDist = Infinity;
    for (const b of BEZIRK_COORDS) {
      const dist = (b.lat - lat) ** 2 + (b.lng - lng) ** 2;
      if (dist < minDist) {
        minDist = dist;
        nearest = b.name;
      }
    }
    return nearest;
  }

  return "Mitte";
}

const TYPE_KEYWORDS: Record<string, string[]> = {
  "Music & Nightlife": ["music", "concert", "dj", "jazz", "techno", "club", "party", "nightlife", "band", "live music", "open mic", "karaoke", "rave"],
  "Food & Drink": ["food", "drink", "dinner", "brunch", "lunch", "breakfast", "coffee", "beer", "wine", "cocktail", "restaurant", "cooking", "tasting", "culinary", "supper"],
  "Arts & Culture": ["art", "gallery", "museum", "exhibition", "film", "cinema", "theater", "theatre", "poetry", "paint", "photo", "culture", "screening", "colourist"],
  "Fitness/Sports": ["fitness", "sport", "run", "yoga", "gym", "workout", "boxing", "cycling", "swim", "basketball", "football", "soccer", "volleyball", "marathon"],
  "Networking": ["network", "founder", "startup", "entrepreneur", "investor", "pitch", "business", "professional", "career", "hiring", "recruiting", "demo day", "fireside", "e-commerce", "saas", "b2b"],
  "Workshops": ["workshop", "class", "learn", "hands-on", "masterclass", "tutorial", "bootcamp", "course", "training", "craft", "making"],
  "Wellness": ["wellness", "meditation", "mindful", "breathwork", "healing", "spa", "retreat", "therapy", "holistic", "cacao", "sound bath", "longevity", "biohack"],
  "Community": ["community", "meetup", "meet-up", "social", "hangout", "gathering", "volunteer", "book club", "language exchange", "board game", "pub quiz"],
  "Outdoors": ["outdoor", "hike", "park", "garden", "nature", "picnic", "bike", "walk", "tour", "forest"],
  "Shopping & Markets": ["market", "flea", "vintage", "shop", "fair", "bazaar", "swap", "pop-up market"],
};

function inferEventType(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  let bestType = "Community";
  let bestScore = 0;

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  return bestType;
}

export async function parseImportContent(req: ParseRequest): Promise<ParseResult> {
  let textContent = req.content;
  const isPdf = req.source_type === "pdf";

  // Fast path: structured JSON — no API calls needed
  if (req.source_type === "json") {
    const directEvents = tryParseStructuredJson(textContent);
    if (directEvents && directEvents.length > 0) {
      console.log(`Fast path: mapped ${directEvents.length} structured JSON events`);
      return {
        events: directEvents,
        source_summary: `Mapped ${directEvents.length} events from structured JSON`,
      };
    }
  }

  // For URLs, fetch the page content
  if (req.source_type === "url") {
    textContent = await fetchUrl(req.content);
  }

  if (IS_MOCK || !client) {
    console.log("Using mock import parser (no API key configured)");
    return buildMockResult(textContent);
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
