import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoodSelector } from "../components/planner/MoodSelector";
import { DayTimePicker } from "../components/planner/DayTimePicker";
import { DistrictSelector } from "../components/planner/DistrictSelector";
import { StepIndicator } from "../components/planner/StepIndicator";
import { Button } from "../components/ui/Button";
import { usePlannerForm } from "../hooks/usePlannerForm";
import { useItinerary } from "../hooks/useItinerary";
import { LoadingState } from "../components/itinerary/LoadingState";

const STEPS = ["Mood", "When", "Where"];

export function HomePage() {
  const { state, isValid, setMood, setDate, toggleTimeBlock, toggleBezirk } =
    usePlannerForm();
  const { loading, error, generate } = useItinerary();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);

  // IntersectionObserver to update step indicator
  useEffect(() => {
    const refs = [step1Ref, step2Ref, step3Ref];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = refs.findIndex((r) => r.current === entry.target);
            if (idx >= 0) setCurrentStep(idx);
          }
        }
      },
      { threshold: 0.5 },
    );

    refs.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  const handleGenerate = async () => {
    const result = await generate({
      date: state.date,
      timeBlocks: state.timeBlocks,
      bezirke: state.bezirke,
      energyScore: state.energyScore,
      socialScore: state.socialScore,
    });
    if (result) {
      // Store result (itinerary + events) in sessionStorage for the itinerary page
      sessionStorage.setItem("generateResult", JSON.stringify(result));
      sessionStorage.setItem("plannerState", JSON.stringify(state));
      navigate("/itinerary");
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} steps={STEPS} />

      {/* Step 1: Mood */}
      <div ref={step1Ref} className="pt-2">
        <MoodSelector
          energy={state.energyScore}
          social={state.socialScore}
          onChange={setMood}
        />
      </div>

      {/* Step 2: Day & Time */}
      <div ref={step2Ref} className="pt-2">
        <DayTimePicker
          date={state.date}
          timeBlocks={state.timeBlocks}
          onDateChange={setDate}
          onToggleTimeBlock={toggleTimeBlock}
        />
      </div>

      {/* Step 3: Districts */}
      <div ref={step3Ref} className="pt-2">
        <DistrictSelector
          selected={state.bezirke}
          onToggle={toggleBezirk}
        />
      </div>

      {/* Generate button */}
      <div className="pb-8">
        {error && (
          <p className="text-sm text-red-500 text-center mb-3">{error}</p>
        )}
        <Button
          size="lg"
          className="w-full text-lg"
          disabled={!isValid || loading}
          onClick={handleGenerate}
        >
          Plan My Day
        </Button>
        {!isValid && (
          <p className="text-xs text-text-light text-center mt-2">
            Select at least one time block and one district
          </p>
        )}
      </div>
    </div>
  );
}
