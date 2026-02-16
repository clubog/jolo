import { pool } from "../db/pool.js";

const DEFAULT_MINUTES = 25;

export async function getTravelTime(from: string, to: string): Promise<number> {
  if (from === to) return 10;
  const { rows } = await pool.query(
    "SELECT minutes FROM travel_times WHERE from_bezirk = $1 AND to_bezirk = $2",
    [from, to],
  );
  return rows[0]?.minutes ?? DEFAULT_MINUTES;
}

export async function getTravelTimeMap(
  bezirke: string[],
): Promise<Record<string, Record<string, number>>> {
  const unique = [...new Set(bezirke)];
  const map: Record<string, Record<string, number>> = {};

  if (unique.length === 0) return map;

  const { rows } = await pool.query(
    `SELECT from_bezirk, to_bezirk, minutes FROM travel_times
     WHERE from_bezirk = ANY($1) AND to_bezirk = ANY($1)`,
    [unique],
  );

  // Initialize all pairs with default
  for (const a of unique) {
    map[a] = {};
    for (const b of unique) {
      map[a][b] = a === b ? 10 : DEFAULT_MINUTES;
    }
  }

  // Overwrite with actual data
  for (const row of rows) {
    if (!map[row.from_bezirk]) map[row.from_bezirk] = {};
    map[row.from_bezirk][row.to_bezirk] = row.minutes;
  }

  return map;
}
