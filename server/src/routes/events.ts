import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createEventSchema, updateEventSchema } from "../types/event.js";
import { ApiError } from "../types/common.js";
import * as eventService from "../services/event-service.js";

export const eventsRouter = Router();

eventsRouter.get("/", async (req, res) => {
  const events = await eventService.listEvents(
    req.query as Record<string, string>,
  );
  res.json(events);
});

eventsRouter.get("/:id", async (req, res) => {
  const event = await eventService.getEvent(req.params.id);
  if (!event) throw ApiError.notFound("Event not found");
  res.json(event);
});

eventsRouter.post("/", requireAdmin, validate(createEventSchema), async (req, res) => {
  const event = await eventService.createEvent(req.body);
  res.status(201).json(event);
});

eventsRouter.put("/:id", requireAdmin, validate(updateEventSchema), async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.body);
  if (!event) throw ApiError.notFound("Event not found");
  res.json(event);
});

eventsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const event = await eventService.toggleActive(req.params.id);
  if (!event) throw ApiError.notFound("Event not found");
  res.json(event);
});
