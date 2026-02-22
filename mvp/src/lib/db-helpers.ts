import type { Event as PrismaEvent } from "@prisma/client";
import type { EventData } from "./types";

export function toEventData(e: PrismaEvent): EventData {
  return {
    id: e.id,
    title: e.title,
    date: e.date,
    startTime: e.startTime,
    endTime: e.endTime,
    district: e.district,
    venue: e.venue,
    category: e.category,
    subtags: JSON.parse(e.subtags),
    priceEurMin: e.priceEurMin,
    priceEurMax: e.priceEurMax,
    socialDensity: e.socialDensity,
    socialOpenness: e.socialOpenness,
    energyLevel: e.energyLevel,
    crowdVector: JSON.parse(e.crowdVector),
    accessDifficulty: e.accessDifficulty,
  };
}
