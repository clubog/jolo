import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Map day-of-week to Feb 16–22, 2026
const WEEK_MAP: Record<number, string> = {
  1: "2026-02-16", // Mon
  2: "2026-02-17", // Tue
  3: "2026-02-18", // Wed
  4: "2026-02-19", // Thu
  5: "2026-02-20", // Fri
  6: "2026-02-21", // Sat
  0: "2026-02-22", // Sun
};

async function main() {
  const events = await prisma.event.findMany();
  let updated = 0;

  for (const e of events) {
    const dow = new Date(e.date + "T12:00:00").getDay();
    const newDate = WEEK_MAP[dow];
    if (e.date !== newDate) {
      await prisma.event.update({ where: { id: e.id }, data: { date: newDate } });
      updated++;
    }
  }

  console.log(`Remapped ${updated} of ${events.length} events to Feb 16–22`);

  // Show distribution
  const all = await prisma.event.findMany();
  const counts: Record<string, number> = {};
  for (const e of all) counts[e.date] = (counts[e.date] || 0) + 1;
  for (const [d, c] of Object.entries(counts).sort()) {
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(d + "T12:00:00").getDay()];
    console.log(`  ${day} ${d}: ${c} events`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
