import type { PersonaData } from "./types";

export const PERSONA_PRESETS: Record<string, PersonaData> = {
  founder: {
    id: "preset-founder",
    name: "Founder / Builder",
    homeBaseDistricts: ["Mitte", "Kreuzberg"],
    interests: { tech: 0.9, community: 0.7, art: 0.3, workshop: 0.4 },
    crowdPreferences: { founders: 0.9, investors: 0.7, artists: 0.2 },
    constraintBudgetMax: null,
    constraintEarliestStart: null,
    constraintLatestStart: null,
    constraintDistrictStrict: false,
    hardNopes: [],
  },
  creative: {
    id: "preset-creative",
    name: "Creative / Artist",
    homeBaseDistricts: ["Kreuzberg", "Neukölln", "Wedding"],
    interests: { art: 0.9, music: 0.8, film: 0.6, workshop: 0.5, club: 0.4 },
    crowdPreferences: { artists: 0.9, founders: 0.2 },
    constraintBudgetMax: null,
    constraintEarliestStart: null,
    constraintLatestStart: null,
    constraintDistrictStrict: false,
    hardNopes: [],
  },
  explorer: {
    id: "preset-explorer",
    name: "Culture Explorer",
    homeBaseDistricts: ["Mitte", "Charlottenburg", "Prenzlauer Berg"],
    interests: { art: 0.8, music: 0.7, film: 0.7, community: 0.6, other: 0.5 },
    crowdPreferences: { artists: 0.6, tourists: 0.3 },
    constraintBudgetMax: 40,
    constraintEarliestStart: null,
    constraintLatestStart: "23:00",
    constraintDistrictStrict: false,
    hardNopes: [],
  },
  nightlife: {
    id: "preset-nightlife",
    name: "Nightlife / Party",
    homeBaseDistricts: ["Kreuzberg", "Friedrichshain", "Neukölln"],
    interests: { club: 0.9, music: 0.8, other: 0.4, community: 0.3 },
    crowdPreferences: { artists: 0.5 },
    constraintBudgetMax: null,
    constraintEarliestStart: "16:00",
    constraintLatestStart: null,
    constraintDistrictStrict: false,
    hardNopes: [],
  },
};

// Default for "Custom" — neutral profile, no strong preferences
export const CUSTOM_PERSONA: PersonaData = {
  id: "preset-custom",
  name: "Custom",
  homeBaseDistricts: [],
  interests: {},
  crowdPreferences: {},
  constraintBudgetMax: null,
  constraintEarliestStart: null,
  constraintLatestStart: null,
  constraintDistrictStrict: false,
  hardNopes: [],
};

export function getPersona(key: string): PersonaData {
  return PERSONA_PRESETS[key] ?? CUSTOM_PERSONA;
}

export const PERSONA_KEYS = [...Object.keys(PERSONA_PRESETS), "custom"] as const;
export type PersonaKey = (typeof PERSONA_KEYS)[number];
