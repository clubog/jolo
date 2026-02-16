import { useState, useCallback } from "react";
import type { Itinerary, GenerateRequest } from "../types";
import { generateItinerary } from "../api/itinerary";

export function useItinerary() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (req: GenerateRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateItinerary(req);
      setItinerary(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setItinerary(null);
    setError(null);
  }, []);

  return { itinerary, loading, error, generate, clear };
}
