import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { errorHandler } from "./middleware/error-handler.js";
import { adminRouter } from "./routes/admin.js";
import { eventsRouter } from "./routes/events.js";
import { itineraryRouter } from "./routes/itinerary.js";
import { referenceRouter } from "./routes/reference.js";
import { importRouter } from "./routes/import.js";

export const app = express();

app.set("trust proxy", 1);

app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use("/api/admin", adminRouter);
app.use("/api/events", eventsRouter);
app.use("/api/itinerary", itineraryRouter);
app.use("/api/admin/import", importRouter);
app.use("/api", referenceRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);
