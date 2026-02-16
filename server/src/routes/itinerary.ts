import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { generateRequestSchema } from "../types/itinerary.js";
import { generate } from "../services/itinerary-service.js";

export const itineraryRouter = Router();

itineraryRouter.post(
  "/generate",
  rateLimit,
  validate(generateRequestSchema),
  async (req, res) => {
    const result = await generate(req.body);
    res.json(result);
  },
);
