import { pool } from "../db/pool.js";
import { seedEvents } from "./events.js";
import { travelTimePairs } from "./travel-times.js";

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Clear existing seed data
    await client.query("DELETE FROM events");
    await client.query("DELETE FROM travel_times");

    // Seed events
    for (const event of seedEvents) {
      await client.query(
        `INSERT INTO events (title, description, date, start_time, end_time, address, bezirk, kiez, event_type, energy_score, social_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          event.title, event.description, event.date, event.start_time,
          event.end_time, event.address, event.bezirk, event.kiez,
          event.event_type, event.energy_score, event.social_score,
        ],
      );
    }
    console.log(`Seeded ${seedEvents.length} events`);

    // Seed travel times (bidirectional)
    for (const [from, to, minutes] of travelTimePairs) {
      await client.query(
        `INSERT INTO travel_times (from_bezirk, to_bezirk, minutes) VALUES ($1, $2, $3)
         ON CONFLICT (from_bezirk, to_bezirk) DO NOTHING`,
        [from, to, minutes],
      );
      if (from !== to) {
        await client.query(
          `INSERT INTO travel_times (from_bezirk, to_bezirk, minutes) VALUES ($1, $2, $3)
           ON CONFLICT (from_bezirk, to_bezirk) DO NOTHING`,
          [to, from, minutes],
        );
      }
    }
    console.log(`Seeded travel times`);

    await client.query("COMMIT");
    console.log("Seed complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
