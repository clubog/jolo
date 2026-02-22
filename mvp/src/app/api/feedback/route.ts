import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = req.headers.get("x-session-id") ?? "anonymous";

    const { event_id, action } = body;

    if (!event_id || !action) {
      return NextResponse.json({ error: "event_id, action required" }, { status: 400 });
    }

    if (!["SAVE", "HIDE"].includes(action)) {
      return NextResponse.json({ error: "action must be SAVE or HIDE" }, { status: 400 });
    }

    // Upsert: one feedback per session + event
    const feedback = await prisma.feedback.upsert({
      where: { sessionId_eventId: { sessionId, eventId: event_id } },
      update: { action },
      create: { sessionId, eventId: event_id, action },
    });

    // Analytics
    console.log(JSON.stringify({
      event: action === "SAVE" ? "event_saved" : "event_hidden",
      sessionId,
      eventId: event_id,
      ts: new Date().toISOString(),
    }));

    return NextResponse.json(feedback);
  } catch (err) {
    console.error("POST /api/feedback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.headers.get("x-session-id") ?? "anonymous";
    const feedbacks = await prisma.feedback.findMany({ where: { sessionId } });
    return NextResponse.json(feedbacks);
  } catch (err) {
    console.error("GET /api/feedback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
