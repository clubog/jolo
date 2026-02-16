import { useState, useEffect } from "react";

const MESSAGES = [
  "Checking the U-Bahn schedule...",
  "Asking a local for tips...",
  "Finding the best Spätis...",
  "Scouting the rooftop bars...",
  "Mapping the street art...",
  "Reserving your Currywurst...",
  "Picking the perfect Kiez...",
  "Consulting the Berlin vibes...",
];

export function LoadingState() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 px-4">
      {/* Animated dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full bg-primary"
            style={{
              animation: "bounce 1.4s infinite ease-in-out both",
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>

      <p className="text-lg font-semibold text-text-light text-center transition-all">
        {MESSAGES[msgIndex]}
      </p>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
