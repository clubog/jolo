import { useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import type { ItineraryStop } from "../../types";

interface Props {
  stop: ItineraryStop;
}

export function EventCard({ stop }: Props) {
  const [showAlt, setShowAlt] = useState(false);

  return (
    <Card className="relative">
      {/* Time badge */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-bold text-primary">{stop.time}</span>
        <span className="text-xs text-text-light">#{stop.order}</span>
      </div>

      <h3 className="text-lg font-bold mb-2">{stop.title}</h3>
      <p className="text-sm text-text-light leading-relaxed mb-3">
        {stop.description}
      </p>

      <div className="flex gap-2 flex-wrap">
        <Badge label={`Energy ${stop.order}`} color="primary" />
        <Badge label={`Social`} color="secondary" />
      </div>

      {/* Alternative */}
      {stop.alternative && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => setShowAlt(!showAlt)}
            className="text-sm text-accent font-semibold cursor-pointer hover:underline"
          >
            {showAlt ? "Hide alternative" : "Or try this instead..."}
          </button>
          {showAlt && (
            <div className="mt-2 p-3 bg-accent/5 rounded-xl">
              <h4 className="font-bold text-sm">{stop.alternative.title}</h4>
              <p className="text-sm text-text-light mt-1">
                {stop.alternative.description}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
