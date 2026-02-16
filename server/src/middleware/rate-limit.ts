import type { RequestHandler } from "express";
import { pool } from "../db/pool.js";
import { ApiError } from "../types/common.js";

const MAX_PER_DAY = 10;

export const rateLimit: RequestHandler = async (req, _res, next) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  try {
    const { rows } = await pool.query(
      `INSERT INTO rate_limits (ip, date, count) VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (ip, date) DO UPDATE SET count = rate_limits.count + 1
       RETURNING count`,
      [ip],
    );

    if (rows[0].count > MAX_PER_DAY) {
      // Roll back the increment
      await pool.query(
        `UPDATE rate_limits SET count = count - 1 WHERE ip = $1 AND date = CURRENT_DATE`,
        [ip],
      );
      throw ApiError.tooMany("Rate limit exceeded. Max 10 generations per day.");
    }

    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    next(err);
  }
};
