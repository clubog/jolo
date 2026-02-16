import { z } from "zod";

export const generateRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeBlocks: z
    .array(z.enum(["morning", "afternoon", "evening"]))
    .min(1),
  bezirke: z.array(z.string().min(1)).min(1),
  energyScore: z.coerce.number().int().min(1).max(5),
  socialScore: z.coerce.number().int().min(1).max(5),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

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

export const TIME_BLOCKS = {
  morning: { start: "08:00", end: "12:00" },
  afternoon: { start: "12:00", end: "17:00" },
  evening: { start: "17:00", end: "23:00" },
} as const;
