import { useRef, useCallback } from "react";
import { VIBE_LABELS } from "../../config/constants";

interface Props {
  energy: number;
  social: number;
  onChange: (energy: number, social: number) => void;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function coordsToScore(fraction: number): number {
  return clamp(Math.round(fraction * 4) + 1, 1, 5);
}

function scoreToPercent(score: number): number {
  return ((score - 1) / 4) * 100;
}

export function MoodSelector({ energy, social, onChange }: Props) {
  const padRef = useRef<HTMLDivElement>(null);

  const handlePointer = useCallback(
    (e: React.PointerEvent) => {
      const rect = padRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1);
      onChange(coordsToScore(y), coordsToScore(x));
    },
    [onChange],
  );

  const vibeKey = `${energy}-${social}`;
  const vibeLabel = VIBE_LABELS[vibeKey] || "Berlin Vibes";

  // Gradient based on position
  const hue = 15 + social * 8;
  const sat = 70 + energy * 5;
  const light = 92 - energy * 3;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-center">How are you feeling?</h2>

      <div className="relative mx-auto" style={{ maxWidth: 300 }}>
        {/* Axis labels */}
        <div className="flex justify-between text-xs text-text-light mb-1 px-1">
          <span>Solo</span>
          <span>Social</span>
        </div>

        {/* The 2D pad */}
        <div
          ref={padRef}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            handlePointer(e);
          }}
          onPointerMove={(e) => {
            if (e.buttons > 0) handlePointer(e);
          }}
          className="relative w-full aspect-square rounded-2xl cursor-crosshair touch-none overflow-hidden shadow-inner"
          style={{
            background: `hsl(${hue}, ${sat}%, ${light}%)`,
          }}
        >
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-10">
            {[25, 50, 75].map((p) => (
              <line
                key={`v${p}`}
                x1={`${p}%`}
                y1="0%"
                x2={`${p}%`}
                y2="100%"
                stroke="currentColor"
                strokeWidth="1"
              />
            ))}
            {[25, 50, 75].map((p) => (
              <line
                key={`h${p}`}
                x1="0%"
                y1={`${p}%`}
                x2="100%"
                y2={`${p}%`}
                stroke="currentColor"
                strokeWidth="1"
              />
            ))}
          </svg>

          {/* Dot indicator */}
          <div
            className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full bg-white shadow-lg border-3 border-primary transition-all duration-150 pointer-events-none"
            style={{
              left: `${scoreToPercent(social)}%`,
              bottom: `${scoreToPercent(energy)}%`,
              top: `${100 - scoreToPercent(energy)}%`,
            }}
          />
        </div>

        <div className="flex justify-between text-xs text-text-light mt-1 px-1">
          <div className="flex flex-col items-start">
            <span className="-rotate-90 origin-left translate-y-8 absolute -left-5 top-1/2 -translate-y-1/2 whitespace-nowrap hidden sm:block">
              Calm
            </span>
          </div>
        </div>

        {/* Y-axis labels */}
        <div className="absolute -left-10 top-0 bottom-0 flex flex-col justify-between text-xs text-text-light py-1">
          <span>Energetic</span>
          <span>Calm</span>
        </div>
      </div>

      {/* Vibe label */}
      <div className="text-center">
        <span className="inline-block px-5 py-2 rounded-full bg-primary/10 text-primary font-bold text-lg">
          {vibeLabel}
        </span>
      </div>
    </div>
  );
}
