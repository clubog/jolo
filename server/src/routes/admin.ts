import { Router } from "express";
import { config } from "../config.js";
import { signToken } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/auth.js";
import { ApiError } from "../types/common.js";
import { getStats } from "../services/event-service.js";

export const adminRouter = Router();

adminRouter.post("/login", (req, res) => {
  const { password } = req.body;
  if (!password || password !== config.ADMIN_PASSWORD) {
    throw ApiError.unauthorized("Invalid password");
  }

  const token = signToken("admin:" + Date.now());
  res.cookie("admin_token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    secure: process.env.NODE_ENV === "production",
  });

  res.json({ ok: true });
});

adminRouter.get("/stats", requireAdmin, async (_req, res) => {
  const stats = await getStats();
  res.json(stats);
});
