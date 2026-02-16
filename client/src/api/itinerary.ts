import type { GenerateRequest, GenerateResult } from "../types";
import { api } from "./client";

export function generateItinerary(req: GenerateRequest): Promise<GenerateResult> {
  return api.post("/api/itinerary/generate", req);
}
