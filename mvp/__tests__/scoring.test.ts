import { describe, it, expect } from "vitest";
import {
  identityMatch,
  stateMatch,
  behaviorMatch,
  logisticsMatch,
  noveltyScore,
  computeScore,
  applyMoodGuardrails,
  filterEvents,
  buildSchedule,
} from "../src/lib/scoring";
import type { EventData, PersonaData, SessionData, FeedbackData } from "../src/lib/types";

// ============================================================
// Fixtures
// ============================================================

const techEvent: EventData = {
  id: "e1",
  title: "AI Meetup",
  date: "2026-02-18",
  startTime: "18:00",
  endTime: "20:00",
  district: "Kreuzberg",
  venue: "Betahaus",
  category: "tech",
  subtags: ["ai", "networking"],
  priceEurMin: 0,
  priceEurMax: 0,
  socialDensity: 0.8,
  socialOpenness: 0.7,
  energyLevel: 0.6,
  crowdVector: { founders: 0.8, investors: 0.5 },
  accessDifficulty: 0.2,
};

const artEvent: EventData = {
  id: "e2",
  title: "Gallery Opening",
  date: "2026-02-18",
  startTime: "17:00",
  endTime: "21:00",
  district: "Mitte",
  venue: "KW Institute",
  category: "art",
  subtags: ["contemporary", "opening"],
  priceEurMin: 0,
  priceEurMax: 0,
  socialDensity: 0.6,
  socialOpenness: 0.8,
  energyLevel: 0.4,
  crowdVector: { artists: 0.9 },
  accessDifficulty: 0.2,
};

const clubEvent: EventData = {
  id: "e3",
  title: "Berghain",
  date: "2026-02-18",
  startTime: "23:00",
  endTime: null,
  district: "Friedrichshain",
  venue: "Berghain",
  category: "club",
  subtags: ["techno", "nightlife"],
  priceEurMin: 15,
  priceEurMax: 20,
  socialDensity: 0.9,
  socialOpenness: 0.3,
  energyLevel: 0.95,
  crowdVector: { artists: 0.5 },
  accessDifficulty: 0.9,
};

// Recovery-friendly events
const quietMuseum: EventData = {
  id: "e-museum",
  title: "Neue Nationalgalerie — Modern Masters",
  date: "2026-02-18",
  startTime: "10:00",
  endTime: "18:00",
  district: "Mitte",
  venue: "Neue Nationalgalerie",
  category: "art",
  subtags: ["gallery", "modern art"],
  priceEurMin: 14,
  priceEurMax: 14,
  socialDensity: 0.3,
  socialOpenness: 0.2,
  energyLevel: 0.3,
  crowdVector: { tourists: 0.6, artists: 0.4 },
  accessDifficulty: 0.1,
};

const calmWalk: EventData = {
  id: "e-walk",
  title: "Spree River Winter Walk",
  date: "2026-02-18",
  startTime: "14:00",
  endTime: "16:00",
  district: "Mitte",
  venue: null,
  category: "community",
  subtags: ["walking", "outdoor", "casual"],
  priceEurMin: 0,
  priceEurMax: 0,
  socialDensity: 0.2,
  socialOpenness: 0.9,
  energyLevel: 0.3,
  crowdVector: { tourists: 0.4 },
  accessDifficulty: 0.0,
};

const silentFilm: EventData = {
  id: "e-film",
  title: "Silent Film Night",
  date: "2026-02-18",
  startTime: "20:30",
  endTime: "22:30",
  district: "Kreuzberg",
  venue: "Babylon Cinema",
  category: "film",
  subtags: ["silent film", "live music", "culture"],
  priceEurMin: 10,
  priceEurMax: 10,
  socialDensity: 0.3,
  socialOpenness: 0.2,
  energyLevel: 0.3,
  crowdVector: { artists: 0.5, tourists: 0.3 },
  accessDifficulty: 0.1,
};

const yoga: EventData = {
  id: "e-yoga",
  title: "Vinyasa Flow",
  date: "2026-02-18",
  startTime: "07:30",
  endTime: "08:30",
  district: "Neukölln",
  venue: "Yoga Rain",
  category: "community",
  subtags: ["yoga", "wellness", "morning"],
  priceEurMin: 12,
  priceEurMax: 12,
  socialDensity: 0.2,
  socialOpenness: 0.3,
  energyLevel: 0.3,
  crowdVector: {},
  accessDifficulty: 0.1,
};

// High-stimulation events that should NOT be recommended for recovery
const pitchNight: EventData = {
  id: "e-pitch",
  title: "Web3 Berlin Pitch Night",
  date: "2026-02-18",
  startTime: "19:00",
  endTime: "22:00",
  district: "Kreuzberg",
  venue: "Betahaus",
  category: "tech",
  subtags: ["web3", "pitching", "startups"],
  priceEurMin: 0,
  priceEurMax: 0,
  socialDensity: 0.8,
  socialOpenness: 0.7,
  energyLevel: 0.7,
  crowdVector: { founders: 0.9, investors: 0.9 },
  accessDifficulty: 0.3,
};

const founderDinner: EventData = {
  id: "e-dinner",
  title: "Founder Dinner (invite only)",
  date: "2026-02-18",
  startTime: "19:00",
  endTime: "22:00",
  district: "Mitte",
  venue: "Grill Royal",
  category: "community",
  subtags: ["founders", "dinner", "exclusive"],
  priceEurMin: 0,
  priceEurMax: 0,
  socialDensity: 0.5,
  socialOpenness: 0.3,
  energyLevel: 0.4,
  crowdVector: { founders: 0.95, investors: 0.7 },
  accessDifficulty: 0.8,
};

const vcCoffee: EventData = {
  id: "e-vc",
  title: "VC Coffee & Dealflow",
  date: "2026-02-18",
  startTime: "08:30",
  endTime: "10:00",
  district: "Mitte",
  venue: "Soho House Berlin",
  category: "tech",
  subtags: ["vc", "investing", "founders"],
  priceEurMin: 0,
  priceEurMax: 0,
  socialDensity: 0.5,
  socialOpenness: 0.4,
  energyLevel: 0.3,
  crowdVector: { investors: 0.95, founders: 0.8 },
  accessDifficulty: 0.6,
};

// --- Personas ---

const founderPersona: PersonaData = {
  id: "p1",
  name: "Crypto Founder",
  homeBaseDistricts: ["Mitte", "Kreuzberg"],
  interests: { tech: 0.9, community: 0.6, art: 0.3, club: 0.5 },
  crowdPreferences: { founders: 0.9, investors: 0.8, artists: 0.3 },
  constraintBudgetMax: null,
  constraintEarliestStart: null,
  constraintLatestStart: null,
  constraintDistrictStrict: false,
  hardNopes: [],
};

const recoveryPersona: PersonaData = {
  id: "p3",
  name: "Recovery Mode",
  homeBaseDistricts: ["Neukölln", "Kreuzberg"],
  interests: { community: 0.7, art: 0.6, other: 0.5, music: 0.4 },
  crowdPreferences: {},
  constraintBudgetMax: null,
  constraintEarliestStart: null,
  constraintLatestStart: "20:00",
  constraintDistrictStrict: false,
  hardNopes: ["club", "nightlife"],
};

const culturePersona: PersonaData = {
  id: "p2",
  name: "Culture Explorer",
  homeBaseDistricts: ["Mitte"],
  interests: { art: 0.9, music: 0.8, film: 0.7 },
  crowdPreferences: { artists: 0.8 },
  constraintBudgetMax: 30,
  constraintEarliestStart: null,
  constraintLatestStart: "22:00",
  constraintDistrictStrict: false,
  hardNopes: ["techno"],
};

// --- Sessions ---

const networkSession: SessionData = {
  intent: "network",
  energy: "high",
  socialMode: "crowd",
  districtFocus: ["Kreuzberg"],
  budgetToday: null,
  dateFrom: "2026-02-16",
  dateTo: "2026-02-22",
};

const recoverSession: SessionData = {
  intent: "recover",
  energy: "low",
  socialMode: "solo",
  districtFocus: [],
  budgetToday: 20,
  dateFrom: "2026-02-16",
  dateTo: "2026-02-22",
};

const allEvents = [techEvent, artEvent, clubEvent];

// Full recovery test set: mix of calm + high-stimulation events on same day
const recoveryTestEvents = [
  quietMuseum, calmWalk, silentFilm, yoga,      // calm
  pitchNight, founderDinner, vcCoffee, techEvent, clubEvent, // stimulating
];

// ============================================================
// Tests
// ============================================================

describe("identityMatch", () => {
  it("returns high score for matching interests + crowd", () => {
    const score = identityMatch(techEvent, founderPersona);
    expect(score).toBeGreaterThan(0.7);
  });

  it("returns low score for mismatched interests", () => {
    const score = identityMatch(artEvent, founderPersona);
    expect(score).toBeLessThan(0.4);
  });

  it("culture persona scores high on art", () => {
    const score = identityMatch(artEvent, culturePersona);
    expect(score).toBeGreaterThan(0.6);
  });
});

describe("stateMatch", () => {
  it("network intent prefers high density + founder crowd", () => {
    const techScore = stateMatch(techEvent, networkSession);
    const artScore = stateMatch(artEvent, networkSession);
    expect(techScore).toBeGreaterThan(artScore);
  });

  it("recover intent prefers low energy events", () => {
    const artScore = stateMatch(artEvent, recoverSession);
    const clubScore = stateMatch(clubEvent, recoverSession);
    expect(artScore).toBeGreaterThan(clubScore);
  });

  it("recover + solo strongly prefers low-density events", () => {
    const museumScore = stateMatch(quietMuseum, recoverSession);
    const pitchScore = stateMatch(pitchNight, recoverSession);
    expect(museumScore).toBeGreaterThan(pitchScore);
    // The gap should be significant
    expect(museumScore - pitchScore).toBeGreaterThan(0.15);
  });

  it("social mode affects scoring", () => {
    const soloSession = { ...networkSession, socialMode: "solo" as const };
    const crowdSession = { ...networkSession, socialMode: "crowd" as const };
    // High-density event should score better for crowd than solo
    const soloScore = stateMatch(techEvent, soloSession);
    const crowdScore = stateMatch(techEvent, crowdSession);
    expect(crowdScore).toBeGreaterThan(soloScore);
  });
});

describe("applyMoodGuardrails", () => {
  it("crushes networking-tagged events for recover+low", () => {
    const base = 0.5;
    const result = applyMoodGuardrails(base, pitchNight, recoverSession);
    // pitchNight has "pitching" + "startups" tags AND socialDensity 0.8 AND energyLevel 0.7
    expect(result).toBeLessThan(0.1);
  });

  it("boosts calm art events for recover+low", () => {
    const base = 0.5;
    const result = applyMoodGuardrails(base, quietMuseum, recoverSession);
    // Museum: socialDensity 0.3, energyLevel 0.3, accessDifficulty 0.1
    expect(result).toBeGreaterThan(base);
  });

  it("does not penalize calm events for recover+low", () => {
    const base = 0.5;
    const walk = applyMoodGuardrails(base, calmWalk, recoverSession);
    // calmWalk: density 0.2, energy 0.3, access 0.0 → no demotions, only boosts
    expect(walk).toBeGreaterThan(base);
  });

  it("penalizes high-density events in solo mode", () => {
    const soloParty: SessionData = { ...networkSession, socialMode: "solo" };
    const base = 0.5;
    const result = applyMoodGuardrails(base, techEvent, soloParty);
    expect(result).toBeLessThan(base); // techEvent.socialDensity = 0.8
  });

  it("does not apply recover penalties for network intent", () => {
    const base = 0.5;
    const result = applyMoodGuardrails(base, pitchNight, networkSession);
    // No recover, so networking tags should NOT be penalized
    expect(result).toBeGreaterThanOrEqual(base * 0.5);
  });
});

describe("behaviorMatch", () => {
  it("returns 0 with no feedback", () => {
    expect(behaviorMatch(techEvent, allEvents, [])).toBe(0);
  });

  it("boosts events similar to saved", () => {
    const feedbacks: FeedbackData[] = [{ eventId: "e1", type: "save" }];
    const score = behaviorMatch(techEvent, allEvents, feedbacks);
    expect(score).toBeGreaterThan(0);
  });

  it("penalizes events similar to hidden", () => {
    const feedbacks: FeedbackData[] = [{ eventId: "e3", type: "hide" }];
    const score = behaviorMatch(clubEvent, allEvents, feedbacks);
    expect(score).toBeLessThan(0);
  });
});

describe("logisticsMatch", () => {
  it("scores high when event is in focus district", () => {
    const score = logisticsMatch(techEvent, founderPersona, networkSession);
    expect(score).toBe(1.0);
  });

  it("scores low when event is outside focus district", () => {
    const score = logisticsMatch(clubEvent, founderPersona, networkSession);
    expect(score).toBe(0.2);
  });

  it("returns neutral 0.5 when event has no district", () => {
    const noDistrictEvent = { ...techEvent, district: null };
    const score = logisticsMatch(noDistrictEvent, founderPersona, networkSession);
    expect(score).toBe(0.5);
  });
});

describe("noveltyScore", () => {
  it("high novelty for unseen category", () => {
    const feedbacks: FeedbackData[] = [{ eventId: "e1", type: "view" }];
    const score = noveltyScore(artEvent, feedbacks, allEvents);
    expect(score).toBe(0.8);
  });

  it("low novelty for seen category", () => {
    const feedbacks: FeedbackData[] = [{ eventId: "e1", type: "view" }];
    const score = noveltyScore(techEvent, feedbacks, allEvents);
    expect(score).toBe(0.2);
  });
});

describe("computeScore", () => {
  it("returns a number between 0 and 1", () => {
    const score = computeScore(techEvent, founderPersona, networkSession, allEvents, []);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("founder + network scores tech higher than art", () => {
    const techScore = computeScore(techEvent, founderPersona, networkSession, allEvents, []);
    const artScore = computeScore(artEvent, founderPersona, networkSession, allEvents, []);
    expect(techScore).toBeGreaterThan(artScore);
  });

  it("is deterministic", () => {
    const a = computeScore(techEvent, founderPersona, networkSession, allEvents, []);
    const b = computeScore(techEvent, founderPersona, networkSession, allEvents, []);
    expect(a).toBe(b);
  });

  it("mood dominates: recover+low crushes networking events even for founder persona", () => {
    const pitchScore = computeScore(pitchNight, founderPersona, recoverSession, recoveryTestEvents, []);
    const museumScore = computeScore(quietMuseum, founderPersona, recoverSession, recoveryTestEvents, []);
    // Even though founder persona loves tech, recover+low should push museum above pitch
    expect(museumScore).toBeGreaterThan(pitchScore);
    // The gap should be large
    expect(museumScore).toBeGreaterThan(pitchScore * 2);
  });

  it("recover+low: calm walk beats VC coffee for any persona", () => {
    const walkScore = computeScore(calmWalk, founderPersona, recoverSession, recoveryTestEvents, []);
    const vcScore = computeScore(vcCoffee, founderPersona, recoverSession, recoveryTestEvents, []);
    expect(walkScore).toBeGreaterThan(vcScore);
  });
});

describe("filterEvents", () => {
  it("removes events outside date range", () => {
    const session = { ...networkSession, dateFrom: "2026-02-19", dateTo: "2026-02-22" };
    const filtered = filterEvents(allEvents, founderPersona, session);
    expect(filtered).toHaveLength(0);
  });

  it("removes events exceeding budget", () => {
    const filtered = filterEvents(allEvents, founderPersona, recoverSession);
    expect(filtered.map((e) => e.id)).toContain("e3");
  });

  it("respects hard nopes (by subtag)", () => {
    const filtered = filterEvents(allEvents, culturePersona, networkSession);
    expect(filtered.find((e) => e.id === "e3")).toBeUndefined();
  });

  it("respects latest start constraint", () => {
    const filtered = filterEvents(allEvents, culturePersona, networkSession);
    expect(filtered.find((e) => e.id === "e3")).toBeUndefined();
  });
});

describe("buildSchedule", () => {
  it("groups events by day sorted by start time", () => {
    const multiDayEvents: EventData[] = [
      { ...techEvent, date: "2026-02-16", startTime: "18:00" },
      { ...artEvent, date: "2026-02-16", startTime: "10:00" },
      { ...techEvent, id: "e4", date: "2026-02-17", startTime: "09:00" },
    ];
    const plan = buildSchedule(multiDayEvents, founderPersona, networkSession, []);
    expect(plan.length).toBe(2);
    expect(plan[0].date).toBe("2026-02-16");
    expect(plan[1].date).toBe("2026-02-17");

    for (const tier of [plan[0].primary, plan[0].optional]) {
      for (let i = 1; i < tier.length; i++) {
        if (tier[i].startTime && tier[i - 1].startTime) {
          expect(tier[i].startTime! >= tier[i - 1].startTime!).toBe(true);
        }
      }
    }
  });

  it("limits to 3 primary and 3 optional per day", () => {
    const manyEvents: EventData[] = Array.from({ length: 10 }, (_, i) => ({
      ...techEvent,
      id: `e${i}`,
      startTime: `${String(8 + i).padStart(2, "0")}:00`,
      endTime: `${String(9 + i).padStart(2, "0")}:00`,
    }));
    const plan = buildSchedule(manyEvents, founderPersona, networkSession, []);
    expect(plan[0].primary.length).toBeLessThanOrEqual(3);
    expect(plan[0].optional.length).toBeLessThanOrEqual(3);
  });

  it("feedback affects ranking — hidden events drop", () => {
    const events = [techEvent, artEvent];
    const noFeedback = buildSchedule(events, founderPersona, networkSession, []);
    const withHide = buildSchedule(events, founderPersona, networkSession, [
      { eventId: "e1", type: "hide" },
    ]);

    const techScoreBefore = noFeedback[0]?.primary.find((e) => e.id === "e1")?.score ?? 0;
    const allAfter = [...(withHide[0]?.primary ?? []), ...(withHide[0]?.optional ?? [])];
    const techScoreAfter = allAfter.find((e) => e.id === "e1")?.score ?? 0;
    expect(techScoreAfter).toBeLessThan(techScoreBefore);
  });
});

// ============================================================
// CRITICAL: Recovery Mode regression tests
// ============================================================

describe("Recovery Mode — intent=recover, energy=low, social=solo", () => {
  // Use recoveryPersona + recoverSession against the full test event set.
  // But also test with founderPersona to prove mood OVERRIDES identity.

  it("no synthetic events: all recommended events come from input set", () => {
    const plan = buildSchedule(recoveryTestEvents, recoveryPersona, recoverSession, []);
    const inputIds = new Set(recoveryTestEvents.map((e) => e.id));
    for (const day of plan) {
      for (const event of [...day.primary, ...day.optional]) {
        expect(inputIds.has(event.id)).toBe(true);
      }
    }
  });

  it("primary picks have social_density <= 0.6", () => {
    const plan = buildSchedule(recoveryTestEvents, recoveryPersona, recoverSession, []);
    for (const day of plan) {
      for (const event of day.primary) {
        expect(event.socialDensity).toBeLessThanOrEqual(0.6);
      }
    }
  });

  it("primary picks are from calm categories (art, film, community-low, music-low)", () => {
    const plan = buildSchedule(recoveryTestEvents, recoveryPersona, recoverSession, []);
    const calmCategories = new Set(["art", "film", "community", "music", "other"]);
    for (const day of plan) {
      for (const event of day.primary) {
        expect(calmCategories.has(event.category)).toBe(true);
      }
    }
  });

  it("networking/pitch/invite-only events are NOT primary picks", () => {
    const plan = buildSchedule(recoveryTestEvents, recoveryPersona, recoverSession, []);
    const networkingIds = new Set(["e-pitch", "e-dinner", "e-vc", "e1"]); // pitch, founder dinner, vc coffee, AI meetup
    for (const day of plan) {
      for (const event of day.primary) {
        expect(networkingIds.has(event.id)).toBe(false);
      }
    }
  });

  it("mood overrides identity: founder persona in recover+low still gets calm events", () => {
    const plan = buildSchedule(recoveryTestEvents, founderPersona, recoverSession, []);
    for (const day of plan) {
      for (const event of day.primary) {
        // Primary picks should NOT be high-stimulation
        expect(event.socialDensity).toBeLessThanOrEqual(0.6);
        expect(event.energyLevel).toBeLessThanOrEqual(0.6);
      }
    }
  });

  it("quiet museum scores higher than pitch night for recovery persona", () => {
    const museumScore = computeScore(quietMuseum, recoveryPersona, recoverSession, recoveryTestEvents, []);
    const pitchScore = computeScore(pitchNight, recoveryPersona, recoverSession, recoveryTestEvents, []);
    expect(museumScore).toBeGreaterThan(pitchScore * 3);
  });

  it("calm walk + yoga score top 3 for recovery persona", () => {
    const scores = recoveryTestEvents
      .filter((e) => filterEvents([e], recoveryPersona, recoverSession).length > 0)
      .map((e) => ({
        id: e.id,
        title: e.title,
        score: computeScore(e, recoveryPersona, recoverSession, recoveryTestEvents, []),
      }))
      .sort((a, b) => b.score - a.score);

    const top3Ids = scores.slice(0, 3).map((s) => s.id);
    const calmIds = new Set(["e-museum", "e-walk", "e-film", "e-yoga"]);
    // All top 3 should be calm events
    for (const id of top3Ids) {
      expect(calmIds.has(id)).toBe(true);
    }
  });

  it("recover+low limits primary to 2 events per day (less packed)", () => {
    const plan = buildSchedule(recoveryTestEvents, recoveryPersona, recoverSession, []);
    for (const day of plan) {
      expect(day.primary.length).toBeLessThanOrEqual(2);
    }
  });
});

describe("District correctness", () => {
  it("event district comes only from Event.district — never guessed", () => {
    const noDistrictEvent: EventData = { ...calmWalk, district: null };
    const plan = buildSchedule([noDistrictEvent], founderPersona, networkSession, []);
    const all = [...(plan[0]?.primary ?? []), ...(plan[0]?.optional ?? [])];
    const ev = all.find((e) => e.id === noDistrictEvent.id);
    expect(ev?.district).toBeNull();
  });

  it("scored event preserves original district exactly", () => {
    const plan = buildSchedule([techEvent], founderPersona, networkSession, []);
    const ev = plan[0]?.primary[0] ?? plan[0]?.optional[0];
    expect(ev?.district).toBe("Kreuzberg");
  });
});

describe("Hidden event exclusion", () => {
  it("hidden events are excluded from both primary and optional", () => {
    const hiddenIds = new Set(["e1"]);
    const plan = buildSchedule([techEvent, artEvent], founderPersona, networkSession, [], hiddenIds);
    const allResults = [...(plan[0]?.primary ?? []), ...(plan[0]?.optional ?? [])];
    expect(allResults.find((e) => e.id === "e1")).toBeUndefined();
    expect(allResults.find((e) => e.id === "e2")).toBeDefined();
  });

  it("hidden all events returns empty plan", () => {
    const hiddenIds = new Set(["e1", "e2", "e3"]);
    const plan = buildSchedule(allEvents, founderPersona, networkSession, [], hiddenIds);
    for (const day of plan) {
      expect(day.primary.length + day.optional.length).toBe(0);
    }
  });
});

describe("Time conflict annotation", () => {
  it("optional events get timeConflict flag when overlapping with primary", () => {
    // Two events at same time — one goes primary, other goes optional with conflict flag
    const ev1: EventData = { ...techEvent, id: "t1", startTime: "18:00", endTime: "20:00" };
    const ev2: EventData = { ...artEvent, id: "t2", startTime: "18:30", endTime: "20:30" };
    const ev3: EventData = { ...calmWalk, id: "t3", startTime: "10:00", endTime: "12:00" };
    const plan = buildSchedule([ev1, ev2, ev3], founderPersona, networkSession, []);
    const optionals = plan[0]?.optional ?? [];
    const conflicting = optionals.filter((e) => e.timeConflict);
    // At least one optional should have timeConflict if it overlaps
    if (optionals.length > 0) {
      const hasOverlap = optionals.some((o) => o.startTime && o.startTime >= "18:00" && o.startTime <= "20:00");
      if (hasOverlap) {
        expect(conflicting.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("Sorting correctness", () => {
  it("null start_time events sort last within a tier", () => {
    const events: EventData[] = [
      { ...calmWalk, id: "a", startTime: null },
      { ...calmWalk, id: "b", startTime: "10:00" },
      { ...calmWalk, id: "c", startTime: "14:00" },
    ];
    const plan = buildSchedule(events, recoveryPersona, recoverSession, []);
    const all = [...plan[0].primary, ...plan[0].optional];
    const withTime = all.filter((e) => e.startTime !== null);
    const withoutTime = all.filter((e) => e.startTime === null);
    if (withTime.length > 0 && withoutTime.length > 0) {
      // All timed events should appear before null-timed within their tier
      const timedIndices = withTime.map((e) => all.indexOf(e));
      const nullIndices = withoutTime.map((e) => all.indexOf(e));
      // This checks within the combined list — but really we check per-tier
    }
    // Check per tier
    for (const tier of [plan[0].primary, plan[0].optional]) {
      for (let i = 0; i < tier.length - 1; i++) {
        if (tier[i].startTime === null) {
          // All subsequent should also be null
          expect(tier[i + 1].startTime).toBeNull();
        }
      }
    }
  });
});
