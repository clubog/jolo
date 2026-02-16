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
