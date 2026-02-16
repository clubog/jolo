export interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string;
  end_time: string | null;
  address: string;
  bezirk: string;
  kiez: string | null;
  latitude: number | null;
  longitude: number | null;
  event_type: string;
  energy_score: number;
  social_score: number;
  source: string | null;
  url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ItineraryStop {
  order: number;
  event_id: string;
  title: string;
  time: string;
  description: string;
  travel_to_next: string | null;
  alternative: {
    event_id: string;
    title: string;
    description: string;
  } | null;
}

export interface Itinerary {
  greeting: string;
  stops: ItineraryStop[];
  closing: string;
  total_duration: string;
}

export interface CandidateEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string | null;
  address: string;
  bezirk: string;
  kiez: string | null;
  event_type: string;
  energy_score: number;
  social_score: number;
}

export interface GenerateResult {
  itinerary: Itinerary;
  events: Record<string, CandidateEvent>;
}

export interface GenerateRequest {
  date: string;
  timeBlocks: ("morning" | "afternoon" | "evening")[];
  bezirke: string[];
  energyScore: number;
  socialScore: number;
}

export interface Bezirk {
  name: string;
  kieze: string[];
}

export interface AdminStats {
  total: number;
  byDate: { date: string; count: number }[];
  byBezirk: { bezirk: string; count: number }[];
  byType: { event_type: string; count: number }[];
}

export type TimeBlock = "morning" | "afternoon" | "evening";
