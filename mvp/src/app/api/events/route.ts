import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Support bulk import (array) or single event
  const items = Array.isArray(body) ? body : [body];
  const created = [];

  for (const item of items) {
    const event = await prisma.event.create({
      data: {
        title: item.title,
        date: item.date,
        startTime: item.start_time ?? item.startTime ?? null,
        endTime: item.end_time ?? item.endTime ?? null,
        district: item.district ?? null,
        venue: item.venue ?? null,
        category: item.category ?? "other",
        subtags: JSON.stringify(item.subtags ?? []),
        priceEurMin: item.price_eur_min ?? item.priceEurMin ?? null,
        priceEurMax: item.price_eur_max ?? item.priceEurMax ?? null,
        socialDensity: item.social_density ?? item.socialDensity ?? 0.5,
        socialOpenness: item.social_openness ?? item.socialOpenness ?? 0.5,
        energyLevel: item.energy_level ?? item.energyLevel ?? 0.5,
        crowdVector: JSON.stringify(item.crowd_vector ?? item.crowdVector ?? {}),
        accessDifficulty: item.access_difficulty ?? item.accessDifficulty ?? 0.3,
        source: item.source ?? null,
        sourceUrl: item.source_url ?? item.sourceUrl ?? null,
      },
    });
    created.push(event);
  }

  return NextResponse.json(
    { imported: created.length, events: created },
    { status: 201 },
  );
}
