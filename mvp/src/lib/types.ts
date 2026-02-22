export type Intent = "network" | "learn" | "explore" | "party" | "recover";
export type Energy = "low" | "medium" | "high";
export type SocialMode = "solo" | "small_group" | "crowd";
export type Category =
  | "tech"
  | "art"
  | "music"
  | "club"
  | "community"
  | "workshop"
  | "film"
  | "other";
export type FeedbackType = "save" | "hide" | "view";
export type FeedbackAction = "SAVE" | "HIDE";

export interface EventData {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  district: string | null;
  venue: string | null;
  category: string;
  subtags: string[];
  priceEurMin: number | null;
  priceEurMax: number | null;
  socialDensity: number;
  socialOpenness: number;
  energyLevel: number;
  crowdVector: Record<string, number>;
  accessDifficulty: number;
}

export interface PersonaData {
  id: string;
  name: string;
  homeBaseDistricts: string[];
  interests: Record<string, number>;
  crowdPreferences: Record<string, number>;
  constraintBudgetMax: number | null;
  constraintEarliestStart: string | null;
  constraintLatestStart: string | null;
  constraintDistrictStrict: boolean;
  hardNopes: string[];
}

export interface SessionData {
  intent: Intent;
  energy: Energy;
  socialMode: SocialMode;
  districtFocus: string[];
  budgetToday: number | null;
  dateFrom: string;
  dateTo: string;
}

export interface FeedbackData {
  eventId: string;
  type: FeedbackType;
}

export interface ScoredEvent extends EventData {
  score: number;
  reasons: string[];
  tier: "primary" | "optional";
  timeConflict?: boolean;
}

export interface DayPlan {
  date: string;
  primary: ScoredEvent[];
  optional: ScoredEvent[];
}
