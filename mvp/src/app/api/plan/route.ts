import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildSchedule } from "@/lib/scoring";
import { toEventData } from "@/lib/db-helpers";
import { getPersona } from "@/lib/persona-presets";
import type { SessionData, FeedbackData } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = req.headers.get("x-session-id") ?? "anonymous";

    const { personaKey, intent, energy, socialMode, districtFocus, budgetToday } = body;

    if (!intent || !energy) {
      return NextResponse.json({ error: "intent, energy required" }, { status: 400 });
    }

    const persona = getPersona(personaKey ?? "custom");

    const events = await prisma.event.findMany({ where: { isActive: true } });

    // Get session feedback for behavior matching
    const feedbackRows = await prisma.feedback.findMany({ where: { sessionId } });
    const hiddenEventIds = new Set(
      feedbackRows.filter((f) => f.action === "HIDE").map((f) => f.eventId),
    );
    const feedbacks: FeedbackData[] = feedbackRows.map((f) => ({
      eventId: f.eventId,
      type: f.action === "SAVE" ? "save" as const : "hide" as const,
    }));

    const session: SessionData = {
      intent,
      energy,
      socialMode: socialMode ?? "small_group",
      districtFocus: districtFocus ?? [],
      budgetToday: budgetToday ?? null,
      dateFrom: "2026-02-16",
      dateTo: "2026-02-22",
    };

    const eventData = events.map(toEventData);
    const plan = buildSchedule(eventData, persona, session, feedbacks, hiddenEventIds);

    // Analytics
    const totalResults = plan.reduce((n, d) => n + d.primary.length + d.optional.length, 0);
    console.log(JSON.stringify({
      event: "plan_generated",
      sessionId,
      personaKey: personaKey ?? "custom",
      intent,
      energy,
      socialMode: socialMode ?? "small_group",
      districtFocusCount: (districtFocus ?? []).length,
      numResults: totalResults,
      numDays: plan.length,
      ts: new Date().toISOString(),
    }));

    return NextResponse.json({ plan });
  } catch (err) {
    console.error("POST /api/plan error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
