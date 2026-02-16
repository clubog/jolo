import { useState, useCallback } from "react";
import type { GenerateRequest, GenerateResult } from "../types";
import { generateItinerary } from "../api/itinerary";

export function useItinerary() {
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (req: GenerateRequest) => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateItinerary(req);
      setResult(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    itinerary: result?.itinerary ?? null,
    events: result?.events ?? {},
    loading,
    error,
    generate,
    clear,
  };
}
