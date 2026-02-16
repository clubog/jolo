import type { GenerateRequest, Itinerary } from "../types";
import { api } from "./client";

export function generateItinerary(req: GenerateRequest): Promise<Itinerary> {
  return api.post("/api/itinerary/generate", req);
}
