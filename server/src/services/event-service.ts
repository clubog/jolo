import { pool } from "../db/pool.js";
import type { CreateEvent, UpdateEvent } from "../types/event.js";

interface ListFilters {
  date?: string;
  bezirk?: string;
  type?: string;
  active?: string;
  search?: string;
}

export async function listEvents(filters: ListFilters) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (filters.date) {
    conditions.push(`date = $${i++}`);
    params.push(filters.date);
  }
  if (filters.bezirk) {
    conditions.push(`bezirk = $${i++}`);
    params.push(filters.bezirk);
  }
  if (filters.type) {
    conditions.push(`event_type = $${i++}`);
    params.push(filters.type);
  }
  if (filters.active !== undefined) {
    conditions.push(`is_active = $${i++}`);
    params.push(filters.active === "true");
  }
  if (filters.search) {
    conditions.push(`title ILIKE $${i++}`);
    params.push(`%${filters.search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `SELECT * FROM events ${where} ORDER BY date, start_time`,
    params,
  );
  return rows;
}

export async function getEvent(id: string) {
  const { rows } = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function createEvent(data: CreateEvent) {
  const { rows } = await pool.query(
    `INSERT INTO events (title, description, date, start_time, end_time, address, bezirk, kiez,
       latitude, longitude, event_type, energy_score, social_score, source, url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [
      data.title, data.description, data.date, data.start_time, data.end_time,
      data.address, data.bezirk, data.kiez, data.latitude, data.longitude,
      data.event_type, data.energy_score, data.social_score, data.source, data.url,
    ],
  );
  return rows[0];
}

export async function createEventAsDraft(data: CreateEvent) {
  const { rows } = await pool.query(
    `INSERT INTO events (title, description, date, start_time, end_time, address, bezirk, kiez,
       latitude, longitude, event_type, energy_score, social_score, source, url, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,false) RETURNING *`,
    [
      data.title, data.description, data.date, data.start_time, data.end_time,
      data.address, data.bezirk, data.kiez, data.latitude, data.longitude,
      data.event_type, data.energy_score, data.social_score, data.source, data.url,
    ],
  );
  return rows[0];
}

export async function updateEvent(id: string, data: UpdateEvent) {
  const fields: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${i++}`);
      params.push(value);
    }
  }

  if (fields.length === 0) return getEvent(id);

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE events SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    params,
  );
  return rows[0] || null;
}

export async function toggleActive(id: string) {
  const { rows } = await pool.query(
    `UPDATE events SET is_active = NOT is_active WHERE id = $1 RETURNING *`,
    [id],
  );
  return rows[0] || null;
}

export async function getStats() {
  const [byDate, byBezirk, byType, total] = await Promise.all([
    pool.query(
      `SELECT date, COUNT(*)::int as count FROM events WHERE is_active = true
       GROUP BY date ORDER BY date LIMIT 14`,
    ),
    pool.query(
      `SELECT bezirk, COUNT(*)::int as count FROM events WHERE is_active = true
       GROUP BY bezirk ORDER BY count DESC`,
    ),
    pool.query(
      `SELECT event_type, COUNT(*)::int as count FROM events WHERE is_active = true
       GROUP BY event_type ORDER BY count DESC`,
    ),
    pool.query(
      `SELECT COUNT(*)::int as count FROM events WHERE is_active = true`,
    ),
  ]);

  return {
    total: total.rows[0].count,
    byDate: byDate.rows,
    byBezirk: byBezirk.rows,
    byType: byType.rows,
  };
}
