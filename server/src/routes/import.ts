import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ApiError } from "../types/common.js";
import {
  parseRequestSchema,
  saveRequestSchema,
  parseImportContent,
} from "../services/import-service.js";
import * as eventService from "../services/event-service.js";

export const importRouter = Router();

// Parse input into event candidates
importRouter.post("/parse", requireAdmin, validate(parseRequestSchema), async (req, res) => {
  const result = await parseImportContent(req.body);
  res.json(result);
});

// Bulk insert reviewed events
importRouter.post("/save", requireAdmin, validate(saveRequestSchema), async (req, res) => {
  const { events } = req.body;

  if (events.length > 100) {
    throw ApiError.badRequest("Maximum 100 events per import");
  }

  const failed: { index: number; error: string }[] = [];
  let inserted = 0;

  for (let i = 0; i < events.length; i++) {
    try {
      await eventService.createEvent(events[i]);
      inserted++;
    } catch (err) {
      failed.push({
        index: i,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  res.json({ inserted, failed });
});
