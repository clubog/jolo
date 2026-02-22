import type {
  EventData,
  PersonaData,
  SessionData,
  FeedbackData,
  ScoredEvent,
  DayPlan,
  Intent,
  Energy,
  SocialMode,
} from "./types";

// ============================================================
// Weights: mood/state dominates
// ============================================================
const W = {
  state: 0.40,
  identity: 0.30,
  behavior: 0.15,
  logistics: 0.10,
  novelty: 0.05,
} as const;

// ============================================================
// Tags that signal high-stimulation / networking events
// ============================================================
const NETWORKING_TAGS = new Set([
  "networking", "pitch", "dealflow", "founder dinner", "invite-only",
  "pitching", "founders", "vc", "investing", "startups", "demo day",
]);

// ============================================================
// Identity Match (0..1) — persona interests + crowd prefs
// ============================================================
export function identityMatch(event: EventData, persona: PersonaData): number {
  const interestScore = persona.interests[event.category] ?? 0;
  const crowdScore = crowdSimilarity(persona.crowdPreferences, event.crowdVector);
  return 0.6 * interestScore + 0.4 * crowdScore;
}

function crowdSimilarity(a: Record<string, number>, b: Record<string, number>): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  if (keys.size === 0) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (const k of keys) {
    const va = a[k] ?? 0;
    const vb = b[k] ?? 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ============================================================
// State Match (0..1) — intent + energy + social mode
// ============================================================
const INTENT_PROFILES: Record<Intent, {
  density: number; energy: number; openness: number;
  crowd: Record<string, number>;
}> = {
  network: { density: 0.8, energy: 0.6, openness: 0.7, crowd: { founders: 0.9, investors: 0.8 } },
  learn:   { density: 0.4, energy: 0.5, openness: 0.5, crowd: {} },
  explore: { density: 0.5, energy: 0.6, openness: 0.8, crowd: { artists: 0.6 } },
  party:   { density: 0.9, energy: 0.9, openness: 0.6, crowd: {} },
  recover: { density: 0.15, energy: 0.15, openness: 0.3, crowd: {} },
};

const ENERGY_MAP: Record<Energy, number> = { low: 0.15, medium: 0.5, high: 0.8 };

const SOCIAL_MODE_DENSITY: Record<SocialMode, number> = {
  solo: 0.15,
  small_group: 0.4,
  crowd: 0.8,
};

export function stateMatch(event: EventData, session: SessionData): number {
  const profile = INTENT_PROFILES[session.intent];
  const energyTarget = ENERGY_MAP[session.energy];
  const socialTarget = SOCIAL_MODE_DENSITY[session.socialMode];

  // Fit scores: 1.0 = perfect match, 0.0 = worst mismatch
  const densityFit = 1 - Math.abs(event.socialDensity - profile.density);
  const energyFit = 1 - Math.abs(event.energyLevel - energyTarget);
  const opennessFit = 1 - Math.abs(event.socialOpenness - profile.openness);
  const socialFit = 1 - Math.abs(event.socialDensity - socialTarget);
  const intentCrowdFit = crowdSimilarity(profile.crowd, event.crowdVector);

  return (
    0.25 * densityFit +
    0.25 * energyFit +
    0.20 * socialFit +
    0.15 * opennessFit +
    0.15 * intentCrowdFit
  );
}

// ============================================================
// Behavior Match (-1..1) — feedback-driven
// ============================================================
export function behaviorMatch(
  event: EventData,
  allEvents: EventData[],
  feedbacks: FeedbackData[],
): number {
  if (feedbacks.length === 0) return 0;

  let score = 0;
  const savedCategories = new Set<string>();
  const hiddenCategories = new Set<string>();

  for (const fb of feedbacks) {
    const fbEvent = allEvents.find((e) => e.id === fb.eventId);
    if (!fbEvent) continue;
    if (fb.type === "save") savedCategories.add(fbEvent.category);
    if (fb.type === "hide") hiddenCategories.add(fbEvent.category);
  }

  if (savedCategories.has(event.category)) score += 0.5;
  if (hiddenCategories.has(event.category)) score -= 0.8;

  const eventTags = new Set(event.subtags);
  for (const fb of feedbacks) {
    const fbEvent = allEvents.find((e) => e.id === fb.eventId);
    if (!fbEvent) continue;
    const overlap = fbEvent.subtags.filter((t) => eventTags.has(t)).length;
    if (overlap > 0) {
      score += fb.type === "save" ? 0.2 * overlap : fb.type === "hide" ? -0.3 * overlap : 0;
    }
  }

  return Math.max(-1, Math.min(1, score));
}

// ============================================================
// Logistics Match (0..1) — district proximity
// ============================================================
export function logisticsMatch(event: EventData, persona: PersonaData, session: SessionData): number {
  const focusDistricts = session.districtFocus.length > 0
    ? session.districtFocus
    : persona.homeBaseDistricts;

  // Null district = unknown location, neutral score
  if (!event.district || focusDistricts.length === 0) return 0.5;
  return focusDistricts.includes(event.district) ? 1.0 : 0.2;
}

// ============================================================
// Novelty (0..1)
// ============================================================
export function noveltyScore(event: EventData, feedbacks: FeedbackData[], allEvents: EventData[]): number {
  const viewedCategories = new Set<string>();
  for (const fb of feedbacks) {
    const e = allEvents.find((ev) => ev.id === fb.eventId);
    if (e) viewedCategories.add(e.category);
  }
  return viewedCategories.has(event.category) ? 0.2 : 0.8;
}

// ============================================================
// Post-scoring mood guardrails (multipliers + bonuses)
// ============================================================
function hasNetworkingTags(event: EventData): boolean {
  return event.subtags.some((t) => NETWORKING_TAGS.has(t.toLowerCase()));
}

export function applyMoodGuardrails(
  baseScore: number,
  event: EventData,
  session: SessionData,
): number {
  let score = baseScore;

  const isRecoverLow = session.intent === "recover" && session.energy === "low";
  const isRecoverAny = session.intent === "recover";

  // --- Hard demotions for Recover + Low Energy ---
  if (isRecoverLow) {
    // Networking/pitch/invite-only tags → crush score
    if (hasNetworkingTags(event)) {
      score *= 0.15;
    }
    // High social density → strong penalty
    if (event.socialDensity > 0.7) {
      score *= 0.25;
    }
    // High energy events → penalty
    if (event.energyLevel > 0.7) {
      score *= 0.4;
    }
    // High access difficulty → penalty (stressful for recovery)
    if (event.accessDifficulty > 0.6) {
      score *= 0.5;
    }
  } else if (isRecoverAny) {
    // Softer demotions for recover with medium/high energy
    if (hasNetworkingTags(event)) score *= 0.4;
    if (event.socialDensity > 0.7) score *= 0.5;
    if (event.energyLevel > 0.8) score *= 0.6;
  }

  // --- Positive boosts for Recover + Low ---
  if (isRecoverLow) {
    // Calm cultural events get a boost
    if (["art", "film", "music"].includes(event.category) && event.socialDensity <= 0.5) {
      score += 0.12;
    }
    // Low-key community events (yoga, walks, markets)
    if (event.category === "community" && event.energyLevel <= 0.4 && event.socialDensity <= 0.5) {
      score += 0.10;
    }
    // Easy access events
    if (event.accessDifficulty <= 0.3) {
      score += 0.05;
    }
  }

  // --- Solo mode penalty for high-density ---
  if (session.socialMode === "solo" && event.socialDensity > 0.7) {
    score *= 0.6;
  }

  return score;
}

// ============================================================
// Composite Score
// ============================================================
export function computeScore(
  event: EventData,
  persona: PersonaData,
  session: SessionData,
  allEvents: EventData[],
  feedbacks: FeedbackData[],
): number {
  const identity = identityMatch(event, persona);
  const state = stateMatch(event, session);
  const behavior = behaviorMatch(event, allEvents, feedbacks);
  const logistics = logisticsMatch(event, persona, session);
  const novelty = noveltyScore(event, feedbacks, allEvents);

  // Normalize behavior from [-1,1] to [0,1]
  const behaviorNorm = (behavior + 1) / 2;

  const baseScore =
    W.state * state +
    W.identity * identity +
    W.behavior * behaviorNorm +
    W.logistics * logistics +
    W.novelty * novelty;

  return applyMoodGuardrails(baseScore, event, session);
}

// ============================================================
// Filtering — hard constraints, date range, budget, etc.
// ============================================================
export function filterEvents(
  events: EventData[],
  persona: PersonaData,
  session: SessionData,
): EventData[] {
  return events.filter((event) => {
    // Date range
    if (event.date < session.dateFrom || event.date > session.dateTo) return false;

    // Budget
    if (session.budgetToday != null && event.priceEurMin != null && event.priceEurMin > session.budgetToday) return false;
    if (persona.constraintBudgetMax != null && event.priceEurMin != null && event.priceEurMin > persona.constraintBudgetMax) return false;

    // District strict
    if (persona.constraintDistrictStrict && event.district) {
      const allowed = [...persona.homeBaseDistricts, ...session.districtFocus];
      if (allowed.length > 0 && !allowed.includes(event.district)) return false;
    }

    // Hard nopes
    if (persona.hardNopes.includes(event.category)) return false;
    if (event.subtags.some((t) => persona.hardNopes.includes(t))) return false;

    // Time window
    if (persona.constraintEarliestStart && event.startTime && event.startTime < persona.constraintEarliestStart) return false;
    if (persona.constraintLatestStart && event.startTime && event.startTime > persona.constraintLatestStart) return false;

    return true;
  });
}

// ============================================================
// Explainability — grounded in real event features
// ============================================================
export function explainEvent(
  event: EventData,
  persona: PersonaData,
  session: SessionData,
  feedbacks: FeedbackData[],
  allEvents: EventData[],
): string[] {
  const reasons: string[] = [];

  // Energy/density match for current state
  if (session.intent === "recover" || session.energy === "low") {
    if (event.energyLevel <= 0.4 && event.socialDensity <= 0.5) {
      reasons.push("Low-key atmosphere, good for recharging");
    } else if (event.energyLevel <= 0.4) {
      reasons.push("Calm energy level for your current state");
    }
  }

  if (session.intent === "network") {
    const founderDensity = event.crowdVector.founders ?? 0;
    const investorDensity = event.crowdVector.investors ?? 0;
    if (founderDensity > 0.5 || investorDensity > 0.5) {
      reasons.push(`High founder/investor density (networking opportunity)`);
    }
  }

  if (session.intent === "party" && event.energyLevel > 0.7) {
    reasons.push("High energy — matches party mode");
  }

  // District
  const focusDistricts = session.districtFocus.length > 0 ? session.districtFocus : persona.homeBaseDistricts;
  if (event.district && focusDistricts.includes(event.district)) {
    reasons.push(`In your preferred district: ${event.district}`);
  }

  // Interest match
  if ((persona.interests[event.category] ?? 0) > 0.5) {
    reasons.push(`Matches your ${event.category} interest`);
  }

  // Easy access
  if (event.accessDifficulty <= 0.2 && (session.energy === "low" || session.intent === "recover")) {
    reasons.push("Easy to access, no hassle");
  }

  // Free events
  if (event.priceEurMin === 0) {
    reasons.push("Free entry");
  }

  // Saved similarity
  const savedCategories = new Set(
    feedbacks.filter((f) => f.type === "save")
      .map((f) => allEvents.find((e) => e.id === f.eventId)?.category)
      .filter(Boolean),
  );
  if (savedCategories.has(event.category)) {
    reasons.push("Similar to events you saved");
  }

  if (reasons.length === 0) {
    reasons.push(`${event.category} option for your schedule`);
  }

  return reasons.slice(0, 2);
}

// ============================================================
// Schedule Builder
// ============================================================
const BUFFER_MINUTES = 30;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function addMinutes(time: string, mins: number): string {
  const total = timeToMinutes(time) + mins;
  const h = Math.min(Math.floor(total / 60), 23);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getEventEnd(event: EventData): string | null {
  if (!event.startTime) return null;
  return event.endTime ?? addMinutes(event.startTime, 120);
}

function hasTimeCollision(a: EventData, b: EventData): boolean {
  if (!a.startTime || !b.startTime) return false;
  const aEnd = getEventEnd(a);
  const bEnd = getEventEnd(b);
  if (!aEnd || !bEnd) return false;

  // Add buffer: event A's effective end = endTime + BUFFER
  const aEndBuffered = addMinutes(aEnd, BUFFER_MINUTES);
  const bEndBuffered = addMinutes(bEnd, BUFFER_MINUTES);

  return a.startTime < bEndBuffered && b.startTime < aEndBuffered;
}

export { hasTimeCollision };

export function buildSchedule(
  events: EventData[],
  persona: PersonaData,
  session: SessionData,
  feedbacks: FeedbackData[],
  hiddenEventIds?: Set<string>,
): DayPlan[] {
  const filtered = filterEvents(events, persona, session);

  // Hard exclude hidden events from candidates entirely for primary
  const hidden = hiddenEventIds ?? new Set<string>();

  // Score all filtered events (grounded: only events from the dataset)
  const scored: ScoredEvent[] = filtered.map((event) => ({
    ...event,
    score: computeScore(event, persona, session, events, feedbacks),
    reasons: explainEvent(event, persona, session, feedbacks, events),
    tier: "primary" as const,
  }));

  // Group by day
  const byDay = new Map<string, ScoredEvent[]>();
  for (const event of scored) {
    const list = byDay.get(event.date) ?? [];
    list.push(event);
    byDay.set(event.date, list);
  }

  const isRecoverLow = session.intent === "recover" && session.energy === "low";
  const isLowEnergy = session.energy === "low";

  const plans: DayPlan[] = [];

  for (const [date, dayEvents] of byDay) {
    dayEvents.sort((a, b) => b.score - a.score);

    const primary: ScoredEvent[] = [];
    const optional: ScoredEvent[] = [];

    for (const event of dayEvents) {
      // Hidden events: hard exclude from primary, skip for optional too
      if (hidden.has(event.id)) continue;

      const collision = primary.some((p) => hasTimeCollision(p, event));

      // Recover+low: hard block high-density AND networking-tagged events from primary
      const isHighStimulation = event.socialDensity > 0.6
        || event.energyLevel > 0.7
        || hasNetworkingTags(event);
      const highDensityCount = primary.filter((p) => p.socialDensity > 0.6).length;
      const blockedByMood = isRecoverLow
        ? isHighStimulation
        : isLowEnergy
          ? event.socialDensity > 0.7 && highDensityCount >= 1
          : false;

      // Low energy: limit primary to 2 events/day (less packed schedule)
      const maxPrimary = isRecoverLow ? 2 : 3;

      if (!collision && !blockedByMood && primary.length < maxPrimary) {
        primary.push({ ...event, tier: "primary" });
      } else if (optional.length < 3) {
        // Annotate time conflict for optional events
        const conflictsWithPrimary = primary.some((p) => hasTimeCollision(p, event));
        optional.push({ ...event, tier: "optional", timeConflict: conflictsWithPrimary || undefined });
      }
    }

    // Sort by start time within day (null times last)
    const sortByTime = (a: ScoredEvent, b: ScoredEvent) => {
      if (!a.startTime && !b.startTime) return 0;
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    };
    primary.sort(sortByTime);
    optional.sort(sortByTime);

    plans.push({ date, primary, optional });
  }

  plans.sort((a, b) => a.date.localeCompare(b.date));
  return plans;
}
