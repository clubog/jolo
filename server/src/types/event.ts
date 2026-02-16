import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  address: z.string().min(1).max(500),
  bezirk: z.string().min(1).max(100),
  kiez: z.string().max(100).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  event_type: z.string().min(1).max(100),
  energy_score: z.coerce.number().int().min(1).max(5),
  social_score: z.coerce.number().int().min(1).max(5),
  source: z.string().max(255).optional(),
  url: z.string().url().max(500).optional(),
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEvent = z.infer<typeof createEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;

export interface Event extends CreateEvent {
  id: string;
  is_active: boolean;
  created_at: string;
}
