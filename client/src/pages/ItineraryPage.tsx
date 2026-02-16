import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ItineraryView } from "../components/itinerary/ItineraryView";
import { LoadingState } from "../components/itinerary/LoadingState";
import { Button } from "../components/ui/Button";
import { generateItinerary } from "../api/itinerary";
import type { Itinerary, GenerateRequest } from "../types";

export function ItineraryPage() {
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("itinerary");
    if (stored) {
      setItinerary(JSON.parse(stored));
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleRegenerate = async () => {
    const storedState = sessionStorage.getItem("plannerState");
    if (!storedState) return navigate("/");

    const state = JSON.parse(storedState);
    const req: GenerateRequest = {
      date: state.date,
      timeBlocks: state.timeBlocks,
      bezirke: state.bezirke,
      energyScore: state.energyScore,
      socialScore: state.socialScore,
    };

    setLoading(true);
    setError(null);
    try {
      const result = await generateItinerary(req);
      setItinerary(result);
      sessionStorage.setItem("itinerary", JSON.stringify(result));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "My Berlin Day Plan",
        text: itinerary?.greeting || "Check out my Berlin day plan!",
        url: window.location.href,
      });
    }
  };

  if (loading) return <LoadingState />;
  if (!itinerary) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-center">Your Berlin Day</h1>

      <ItineraryView itinerary={itinerary} />

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <div className="flex gap-3 pb-8">
        <Button onClick={handleRegenerate} variant="secondary" className="flex-1">
          Regenerate
        </Button>
        <Button onClick={() => navigate("/")} variant="ghost" className="flex-1">
          Start Over
        </Button>
        {navigator.share && (
          <Button onClick={handleShare} variant="ghost" size="sm">
            Share
          </Button>
        )}
      </div>
    </div>
  );
}
