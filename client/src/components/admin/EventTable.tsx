import { useState, useEffect } from "react";
import { listEvents, toggleEvent } from "../../api/events";
import type { Event } from "../../types";

interface Props {
  onEdit: (event: Event) => void;
}

export function EventTable({ onEdit }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [filterBezirk, setFilterBezirk] = useState("");
  const [filterType, setFilterType] = useState("");

  const fetchEvents = () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (filterBezirk) params.bezirk = filterBezirk;
    if (filterType) params.type = filterType;
    listEvents(params).then(setEvents).catch(console.error);
  };

  useEffect(() => {
    fetchEvents();
  }, [search, filterBezirk, filterType]);

  const handleToggle = async (id: string) => {
    await toggleEvent(id);
    fetchEvents();
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events..."
          className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-gray-200 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <select
          value={filterBezirk}
          onChange={(e) => setFilterBezirk(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 bg-surface text-sm"
        >
          <option value="">All Districts</option>
          {[...new Set(events.map((e) => e.bezirk))].sort().map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 bg-surface text-sm"
        >
          <option value="">All Types</option>
          {[...new Set(events.map((e) => e.event_type))].sort().map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-light border-b border-gray-200">
              <th className="py-2 px-2">Title</th>
              <th className="py-2 px-2">Date</th>
              <th className="py-2 px-2">Time</th>
              <th className="py-2 px-2">District</th>
              <th className="py-2 px-2">Type</th>
              <th className="py-2 px-2 text-center">E</th>
              <th className="py-2 px-2 text-center">S</th>
              <th className="py-2 px-2 text-center">Active</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr
                key={event.id}
                onClick={() => onEdit(event)}
                className="border-b border-gray-100 hover:bg-primary/5 cursor-pointer"
              >
                <td className="py-2 px-2 font-medium">{event.title}</td>
                <td className="py-2 px-2">{event.date}</td>
                <td className="py-2 px-2">{event.start_time?.slice(0, 5)}</td>
                <td className="py-2 px-2">{event.bezirk}</td>
                <td className="py-2 px-2">{event.event_type}</td>
                <td className="py-2 px-2 text-center">{event.energy_score}</td>
                <td className="py-2 px-2 text-center">{event.social_score}</td>
                <td className="py-2 px-2 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(event.id);
                    }}
                    className={`w-5 h-5 rounded cursor-pointer ${
                      event.is_active ? "bg-accent" : "bg-gray-300"
                    }`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
