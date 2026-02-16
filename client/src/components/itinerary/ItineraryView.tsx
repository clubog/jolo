import type { Itinerary } from "../../types";
import { EventCard } from "./EventCard";
import { TravelConnector } from "./TravelConnector";
import { Card } from "../ui/Card";

interface Props {
  itinerary: Itinerary;
}

export function ItineraryView({ itinerary }: Props) {
  return (
    <div className="space-y-3">
      {/* Greeting */}
      <Card className="bg-primary/5 border border-primary/20">
        <p className="text-base font-medium leading-relaxed">
          {itinerary.greeting}
        </p>
      </Card>

      {/* Timeline */}
      {itinerary.stops.map((stop, i) => (
        <div key={stop.order}>
          <EventCard stop={stop} />
          {stop.travel_to_next && i < itinerary.stops.length - 1 && (
            <TravelConnector travelInfo={stop.travel_to_next} />
          )}
        </div>
      ))}

      {/* Closing */}
      <Card className="bg-secondary/5 border border-secondary/20">
        <p className="text-base font-medium leading-relaxed">
          {itinerary.closing}
        </p>
        <p className="text-sm text-text-light mt-2">
          {itinerary.total_duration}
        </p>
      </Card>
    </div>
  );
}
