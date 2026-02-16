import { pool } from "../db/pool.js";
import type { GenerateRequest, Itinerary } from "../types/itinerary.js";
import { TIME_BLOCKS } from "../types/itinerary.js";
import { getTravelTimeMap } from "./travel-time-service.js";
import { generateItinerary } from "./claude-client.js";

// Adjacent bezirke for widening search
const ADJACENT: Record<string, string[]> = {
  Mitte: ["Kreuzberg", "Friedrichshain", "Prenzlauer Berg", "Charlottenburg", "Schöneberg"],
  Kreuzberg: ["Mitte", "Neukölln", "Friedrichshain", "Schöneberg"],
  Friedrichshain: ["Mitte", "Kreuzberg", "Prenzlauer Berg", "Lichtenberg"],
  Neukölln: ["Kreuzberg", "Treptow-Köpenick"],
  "Prenzlauer Berg": ["Mitte", "Friedrichshain", "Pankow"],
  Charlottenburg: ["Mitte", "Schöneberg", "Wilmersdorf"],
  Schöneberg: ["Mitte", "Kreuzberg", "Charlottenburg"],
  Wilmersdorf: ["Charlottenburg"],
  "Treptow-Köpenick": ["Neukölln"],
  Pankow: ["Prenzlauer Berg"],
  Lichtenberg: ["Friedrichshain"],
};

function getAdjacentBezirke(bezirke: string[]): string[] {
  const adjacent = new Set<string>();
  for (const b of bezirke) {
    for (const a of ADJACENT[b] || []) {
      if (!bezirke.includes(a)) adjacent.add(a);
    }
  }
  return [...adjacent];
}

interface CandidateEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string | null;
  address: string;
  bezirk: string;
  kiez: string | null;
  event_type: string;
  energy_score: number;
  social_score: number;
}

async function queryCandidates(
  req: GenerateRequest,
  bezirke: string[],
  moodTolerance: number,
): Promise<CandidateEvent[]> {
  // Build time conditions
  const timeConditions = req.timeBlocks.map((block) => {
    const tb = TIME_BLOCKS[block];
    return `(start_time >= '${tb.start}' AND start_time < '${tb.end}')`;
  });

  const { rows } = await pool.query(
    `SELECT id, title, description, date, start_time, end_time, address,
            bezirk, kiez, event_type, energy_score, social_score
     FROM events
     WHERE date = $1
       AND is_active = true
       AND bezirk = ANY($2)
       AND energy_score BETWEEN $3 AND $4
       AND social_score BETWEEN $5 AND $6
       AND (${timeConditions.join(" OR ")})
     ORDER BY start_time
     LIMIT 15`,
    [
      req.date,
      bezirke,
      Math.max(1, req.energyScore - moodTolerance),
      Math.min(5, req.energyScore + moodTolerance),
      Math.max(1, req.socialScore - moodTolerance),
      Math.min(5, req.socialScore + moodTolerance),
    ],
  );

  return rows;
}

export interface GenerateResult {
  itinerary: Itinerary;
  events: Record<string, CandidateEvent>;
}

export async function generate(req: GenerateRequest): Promise<GenerateResult> {
  // Step 1: Filter events with progressive widening
  let candidates = await queryCandidates(req, req.bezirke, 1);

  if (candidates.length < 3) {
    // Widen mood tolerance
    candidates = await queryCandidates(req, req.bezirke, 2);
  }

  if (candidates.length < 3) {
    // Widen to adjacent bezirke
    const wider = [...req.bezirke, ...getAdjacentBezirke(req.bezirke)];
    candidates = await queryCandidates(req, wider, 2);
  }

  if (candidates.length < 3) {
    // Remove bezirk filter entirely
    const allBezirke = [
      "Mitte", "Kreuzberg", "Friedrichshain", "Neukölln", "Prenzlauer Berg",
      "Charlottenburg", "Schöneberg", "Wilmersdorf", "Treptow-Köpenick",
      "Pankow", "Lichtenberg",
    ];
    candidates = await queryCandidates(req, allBezirke, 2);
  }

  // Step 2: Build travel time map
  const bezirkeInCandidates = [...new Set(candidates.map((e) => e.bezirk))];
  const travelMap = await getTravelTimeMap(bezirkeInCandidates);

  // Step 3: Build user message for Claude
  const userMessage = `
User preferences:
- Energy level: ${req.energyScore}/5
- Social level: ${req.socialScore}/5
- Date: ${req.date}
- Time blocks: ${req.timeBlocks.join(", ")}
- Preferred districts: ${req.bezirke.join(", ")}

Available events (${candidates.length}):
${candidates
  .map(
    (e) =>
      `- [${e.id}] "${e.title}" at ${e.start_time}${e.end_time ? `–${e.end_time}` : ""} | ${e.bezirk}${e.kiez ? ` (${e.kiez})` : ""} | ${e.event_type} | Energy: ${e.energy_score}/5, Social: ${e.social_score}/5 | ${e.address}
  ${e.description}`,
  )
  .join("\n")}

Travel times between districts (in minutes):
${Object.entries(travelMap)
  .flatMap(([from, tos]) =>
    Object.entries(tos)
      .filter(([to]) => from !== to)
      .map(([to, min]) => `${from} → ${to}: ${min} min`),
  )
  .join("\n")}
`;

  // Step 4: Call Claude
  const itinerary = await generateItinerary(userMessage);

  // Build event lookup map for frontend enrichment
  const events: Record<string, CandidateEvent> = {};
  for (const c of candidates) {
    events[c.id] = c;
  }

  return { itinerary, events };
}
