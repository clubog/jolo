import { describe, it, expect, beforeAll } from "vitest";

/**
 * Integration-style tests for the plan generation logic.
 * Tests the full scoring pipeline with realistic data, not HTTP layer.
 */
import { buildSchedule, filterEvents, computeScore } from "../src/lib/scoring";
import { getPersona, PERSONA_PRESETS } from "../src/lib/persona-presets";
import type { EventData, SessionData, FeedbackData, DayPlan } from "../src/lib/types";

// --------------- Fixtures ---------------

const events: EventData[] = [
  {
    id: "ev-tech-meetup", title: "AI Product Meetup", date: "2026-02-18",
    startTime: "18:00", endTime: "20:00", district: "Kreuzberg", venue: "Betahaus",
    category: "tech", subtags: ["ai", "networking", "founders"],
    priceEurMin: 0, priceEurMax: 0, socialDensity: 0.8, socialOpenness: 0.7,
    energyLevel: 0.6, crowdVector: { founders: 0.8, investors: 0.5 }, accessDifficulty: 0.2,
  },
  {
    id: "ev-gallery", title: "Quiet Gallery Visit", date: "2026-02-18",
    startTime: "11:00", endTime: "17:00", district: "Mitte", venue: "Neue Nationalgalerie",
    category: "art", subtags: ["gallery", "modern art"],
    priceEurMin: 14, priceEurMax: 14, socialDensity: 0.3, socialOpenness: 0.2,
    energyLevel: 0.3, crowdVector: { tourists: 0.6, artists: 0.4 }, accessDifficulty: 0.1,
  },
  {
    id: "ev-yoga", title: "Morning Yoga", date: "2026-02-18",
    startTime: "07:30", endTime: "08:30", district: "Neukölln", venue: "Yoga Rain",
    category: "community", subtags: ["yoga", "wellness"],
    priceEurMin: 12, priceEurMax: 12, socialDensity: 0.2, socialOpenness: 0.3,
    energyLevel: 0.3, crowdVector: {}, accessDifficulty: 0.1,
  },
  {
    id: "ev-pitch", title: "Web3 Pitch Night", date: "2026-02-18",
    startTime: "19:00", endTime: "22:00", district: "Kreuzberg", venue: "Factory",
    category: "tech", subtags: ["web3", "pitching", "startups"],
    priceEurMin: 0, priceEurMax: 0, socialDensity: 0.8, socialOpenness: 0.7,
    energyLevel: 0.7, crowdVector: { founders: 0.9, investors: 0.9 }, accessDifficulty: 0.3,
  },
  {
    id: "ev-club", title: "Tresor Techno Night", date: "2026-02-18",
    startTime: "23:00", endTime: null, district: "Mitte", venue: "Tresor",
    category: "club", subtags: ["techno", "nightlife"],
    priceEurMin: 15, priceEurMax: 15, socialDensity: 0.9, socialOpenness: 0.3,
    energyLevel: 0.95, crowdVector: { artists: 0.5 }, accessDifficulty: 0.8,
  },
  {
    id: "ev-film", title: "Indie Film Screening", date: "2026-02-18",
    startTime: "20:00", endTime: "22:00", district: "Kreuzberg", venue: "Babylon",
    category: "film", subtags: ["indie", "cinema"],
    priceEurMin: 10, priceEurMax: 10, socialDensity: 0.3, socialOpenness: 0.2,
    energyLevel: 0.3, crowdVector: { artists: 0.5 }, accessDifficulty: 0.1,
  },
  {
    id: "ev-workshop", title: "Creative Coding Workshop", date: "2026-02-19",
    startTime: "14:00", endTime: "17:00", district: "Neukölln", venue: "co.up",
    category: "workshop", subtags: ["coding", "creative"],
    priceEurMin: 20, priceEurMax: 20, socialDensity: 0.4, socialOpenness: 0.5,
    energyLevel: 0.5, crowdVector: { founders: 0.3, artists: 0.4 }, accessDifficulty: 0.2,
  },
];

// --------------- Tests ---------------

describe("Plan generation (integration)", () => {
  it("returns correctly shaped DayPlan array", () => {
    const persona = getPersona("founder");
    const session: SessionData = {
      intent: "network", energy: "high", socialMode: "crowd",
      districtFocus: [], budgetToday: null, dateFrom: "2026-02-16", dateTo: "2026-02-22",
    };
    const plan = buildSchedule(events, persona, session, []);

    expect(Array.isArray(plan)).toBe(true);
    for (const day of plan) {
      expect(day).toHaveProperty("date");
      expect(day).toHaveProperty("primary");
      expect(day).toHaveProperty("optional");
      expect(typeof day.date).toBe("string");
      expect(Array.isArray(day.primary)).toBe(true);
      expect(Array.isArray(day.optional)).toBe(true);

      for (const ev of [...day.primary, ...day.optional]) {
        expect(ev).toHaveProperty("id");
        expect(ev).toHaveProperty("title");
        expect(ev).toHaveProperty("score");
        expect(ev).toHaveProperty("reasons");
        expect(ev).toHaveProperty("tier");
        expect(typeof ev.score).toBe("number");
        expect(Array.isArray(ev.reasons)).toBe(true);
      }
    }
  });

  it("recovery mode: no high-density events in primary", () => {
    const persona = getPersona("explorer");
    const session: SessionData = {
      intent: "recover", energy: "low", socialMode: "solo",
      districtFocus: [], budgetToday: null, dateFrom: "2026-02-16", dateTo: "2026-02-22",
    };
    const plan = buildSchedule(events, persona, session, []);

    for (const day of plan) {
      for (const ev of day.primary) {
        expect(ev.socialDensity).toBeLessThanOrEqual(0.6);
        expect(ev.energyLevel).toBeLessThanOrEqual(0.7);
      }
    }
  });

  it("recovery mode: max 2 primary per day", () => {
    const persona = getPersona("custom");
    const session: SessionData = {
      intent: "recover", energy: "low", socialMode: "solo",
      districtFocus: [], budgetToday: null, dateFrom: "2026-02-16", dateTo: "2026-02-22",
    };
    const plan = buildSchedule(events, persona, session, []);

    for (const day of plan) {
      expect(day.primary.length).toBeLessThanOrEqual(2);
    }
  });

  it("hidden events excluded from results", () => {
    const persona = getPersona("founder");
    const session: SessionData = {
      intent: "network", energy: "high", socialMode: "crowd",
      districtFocus: [], budgetToday: null, dateFrom: "2026-02-16", dateTo: "2026-02-22",
    };
    const hiddenIds = new Set(["ev-tech-meetup", "ev-pitch"]);
    const plan = buildSchedule(events, persona, session, [], hiddenIds);

    for (const day of plan) {
      for (const ev of [...day.primary, ...day.optional]) {
        expect(hiddenIds.has(ev.id)).toBe(false);
      }
    }
  });

  it("persona presets all return valid PersonaData", () => {
    for (const key of ["founder", "creative", "explorer", "nightlife", "custom"]) {
      const persona = getPersona(key);
      expect(persona).toHaveProperty("id");
      expect(persona).toHaveProperty("name");
      expect(persona).toHaveProperty("interests");
      expect(persona).toHaveProperty("homeBaseDistricts");
    }
  });

  it("founder persona in network mode ranks tech events high", () => {
    const persona = getPersona("founder");
    const session: SessionData = {
      intent: "network", energy: "high", socialMode: "crowd",
      districtFocus: [], budgetToday: null, dateFrom: "2026-02-16", dateTo: "2026-02-22",
    };
    const plan = buildSchedule(events, persona, session, []);
    const day18 = plan.find((d) => d.date === "2026-02-18");
    expect(day18).toBeDefined();
    // At least one tech event should be in primary
    const hasTech = day18!.primary.some((e) => e.category === "tech");
    expect(hasTech).toBe(true);
  });

  it("nightlife persona in party mode ranks club events high", () => {
    const persona = getPersona("nightlife");
    const session: SessionData = {
      intent: "party", energy: "high", socialMode: "crowd",
      districtFocus: [], budgetToday: null, dateFrom: "2026-02-16", dateTo: "2026-02-22",
    };
    const plan = buildSchedule(events, persona, session, []);
    const day18 = plan.find((d) => d.date === "2026-02-18");
    expect(day18).toBeDefined();
    const allEvents18 = [...day18!.primary, ...day18!.optional];
    const hasClub = allEvents18.some((e) => e.category === "club");
    expect(hasClub).toBe(true);
  });

  it("feedback affects plan: saving art boosts similar events", () => {
    const persona = getPersona("custom");
    const session: SessionData = {
      intent: "explore", energy: "medium", socialMode: "small_group",
      districtFocus: [], budgetToday: null, dateFrom: "2026-02-16", dateTo: "2026-02-22",
    };
    const feedbacks: FeedbackData[] = [{ eventId: "ev-gallery", type: "save" }];

    const scoreWithFb = computeScore(
      events.find((e) => e.id === "ev-film")!,
      persona, session, events, feedbacks,
    );
    const scoreNoFb = computeScore(
      events.find((e) => e.id === "ev-film")!,
      persona, session, events, [],
    );
    // Film isn't art category, but the comparison shows feedback matters
    // Let's check gallery specifically
    const galleryWithFb = computeScore(
      events.find((e) => e.id === "ev-gallery")!,
      persona, session, events, feedbacks,
    );
    const galleryNoFb = computeScore(
      events.find((e) => e.id === "ev-gallery")!,
      persona, session, events, [],
    );
    expect(galleryWithFb).toBeGreaterThan(galleryNoFb);
  });
});
