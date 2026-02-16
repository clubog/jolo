import { useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import type { ItineraryStop, CandidateEvent } from "../../types";

interface Props {
  stop: ItineraryStop;
  event?: CandidateEvent;
}

const ENERGY_LABELS = ["", "Very Calm", "Calm", "Moderate", "Energetic", "Very Energetic"];
const SOCIAL_LABELS = ["", "Solo", "Quiet", "Mixed", "Social", "Very Social"];

export function EventCard({ stop, event }: Props) {
  const [showAlt, setShowAlt] = useState(false);

  return (
    <Card className="relative">
      {/* Time + type badge */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-bold text-primary">{stop.time}</span>
        {event?.event_type && (
          <Badge label={event.event_type} color="accent" />
        )}
      </div>

      <h3 className="text-lg font-bold mb-1">{stop.title}</h3>

      {/* Bezirk + address */}
      {event && (
        <div className="text-xs text-text-light mb-2">
          <span className="font-semibold">{event.bezirk}</span>
          {event.kiez && <span> · {event.kiez}</span>}
          <span className="block mt-0.5">{event.address}</span>
        </div>
      )}

      <p className="text-sm text-text-light leading-relaxed mb-3">
        {stop.description}
      </p>

      {/* Energy + Social badges */}
      {event && (
        <div className="flex gap-2 flex-wrap">
          <Badge
            label={`${ENERGY_LABELS[event.energy_score]} (${event.energy_score}/5)`}
            color="primary"
          />
          <Badge
            label={`${SOCIAL_LABELS[event.social_score]} (${event.social_score}/5)`}
            color="secondary"
          />
        </div>
      )}

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
