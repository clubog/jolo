import type { Event, AdminStats } from "../types";
import { api } from "./client";

export function listEvents(params?: Record<string, string>): Promise<Event[]> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return api.get(`/api/events${qs}`);
}

export function getEvent(id: string): Promise<Event> {
  return api.get(`/api/events/${id}`);
}

export function createEvent(data: Partial<Event>): Promise<Event> {
  return api.post("/api/events", data);
}

export function updateEvent(id: string, data: Partial<Event>): Promise<Event> {
  return api.put(`/api/events/${id}`, data);
}

export function toggleEvent(id: string): Promise<Event> {
  return api.del(`/api/events/${id}`);
}

export function getStats(): Promise<AdminStats> {
  return api.get("/api/admin/stats");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseImport(data: {
  source_type: string;
  content: string;
}): Promise<{ events: any[]; source_summary: string }> {
  return api.post("/api/admin/import/parse", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function saveImport(data: {
  events: any[];
}): Promise<{ inserted: number; failed: { index: number; error: string }[] }> {
  return api.post("/api/admin/import/save", data);
}
