import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import type { Itinerary } from "../types/itinerary.js";

const IS_MOCK = config.ANTHROPIC_API_KEY.startsWith("sk-ant-placeholder");

const client = IS_MOCK ? null : new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a friendly, knowledgeable Berlin local helping someone plan their perfect day. You speak in a warm, casual tone — like a friend who knows every corner of the city.

Given the user's preferences and a list of available events, create a narrative day itinerary. Rules:

1. Select 3-6 events that flow well together (don't use all of them)
2. Sequence events by time and minimize travel between them
3. Include travel time estimates between stops (provided in the context)
4. Respect energy pacing — don't chain 3 high-energy events. Create a natural arc.
5. At 1-2 points, offer an alternative ("or if you'd rather something quieter, head to...")
6. Write each event as 2-3 sentences: what it is, why it's great, and a practical tip
7. Open with a greeting that matches the mood and close with a warm sign-off
8. Use Berlin-specific references naturally (U-Bahn lines, neighborhoods, landmarks)

Respond ONLY with valid JSON (no markdown fences) in this exact format:
{
  "greeting": "Opening line matching the user's mood",
  "stops": [
    {
      "order": 1,
      "event_id": "uuid",
      "title": "Event name",
      "time": "10:00",
      "description": "2-3 sentence narrative description",
      "travel_to_next": "15 min by U-Bahn (U8 to Hermannplatz)" or null,
      "alternative": { "event_id": "uuid", "title": "...", "description": "..." } or null
    }
  ],
  "closing": "Warm closing message",
  "total_duration": "About 6 hours"
}`;

interface CandidateEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  bezirk: string;
  kiez?: string;
  event_type: string;
  energy_score: number;
  social_score: number;
  address: string;
}

function parseCandidates(userMessage: string): CandidateEvent[] {
  const events: CandidateEvent[] = [];
  const regex = /\[([^\]]+)\] "([^"]+)" at (\d{2}:\d{2})/g;
  let match;
  while ((match = regex.exec(userMessage)) !== null) {
    events.push({
      id: match[1],
      title: match[2],
      start_time: match[3],
      description: "",
      bezirk: "Kreuzberg",
      event_type: "",
      energy_score: 3,
      social_score: 3,
      address: "",
    });
  }
  return events;
}

function buildMockItinerary(userMessage: string): Itinerary {
  const candidates = parseCandidates(userMessage);
  // Pick up to 5 events sorted by time
  const picked = candidates.slice(0, 5);

  return {
    greeting:
      "Hey! Looks like you're up for a great evening in Kreuzberg — one of the best neighborhoods to spend a night out. Let me put together something fun for you.",
    stops: picked.map((event, i) => ({
      order: i + 1,
      event_id: event.id,
      title: event.title,
      time: event.start_time,
      description: `A fantastic spot in the heart of Kreuzberg. This is the kind of place locals love — laid-back vibes, great people, and always something happening. Get there a bit early for the best experience.`,
      travel_to_next:
        i < picked.length - 1
          ? `${8 + i * 3} min walk through the Kiez`
          : null,
      alternative:
        i === 1 && candidates[picked.length]
          ? {
              event_id: candidates[picked.length].id,
              title: candidates[picked.length].title,
              description:
                "If you want to switch things up, this is a solid alternative just around the corner.",
            }
          : null,
    })),
    closing:
      "That's a wrap! Kreuzberg never really sleeps, so if you've still got energy, just follow the music. Have an amazing night! 🌙",
    total_duration: `About ${picked.length + 1} hours`,
  };
}

export async function generateItinerary(userMessage: string): Promise<Itinerary> {
  if (IS_MOCK || !client) {
    console.log("Using mock itinerary (no API key configured)");
    return buildMockItinerary(userMessage);
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  return JSON.parse(text) as Itinerary;
}
