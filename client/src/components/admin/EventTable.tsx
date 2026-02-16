import { useState, useEffect } from "react";
import { listEvents, toggleEvent } from "../../api/events";
import { Button } from "../ui/Button";
import type { Event } from "../../types";

interface Props {
  onEdit: (event: Event) => void;
}

export function EventTable({ onEdit }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [filterBezirk, setFilterBezirk] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchEvents = () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (filterBezirk) params.bezirk = filterBezirk;
    if (filterType) params.type = filterType;
    if (filterActive) params.active = filterActive;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    listEvents(params).then(setEvents).catch(console.error);
  };

  useEffect(() => {
    fetchEvents();
  }, [search, filterBezirk, filterType, filterActive, dateFrom, dateTo]);

  const handleToggle = async (id: string) => {
    await toggleEvent(id);
    fetchEvents();
  };

  const handleBulkToggle = async () => {
    await Promise.all([...selected].map((id) => toggleEvent(id)));
    setSelected(new Set());
    fetchEvents();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === events.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(events.map((e) => e.id)));
    }
  };

  // Filtered events by date range (client-side since backend may not support it)
  const filteredEvents = events.filter((e) => {
    if (dateFrom && e.date < dateFrom) return false;
    if (dateTo && e.date > dateTo) return false;
    return true;
  });

  const inputClass =
    "px-3 py-2 rounded-xl border border-gray-200 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="space-y-3">
      {/* Filters row 1: search + dropdowns */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events..."
          className={`flex-1 min-w-[200px] ${inputClass}`}
        />
        <select
          value={filterBezirk}
          onChange={(e) => setFilterBezirk(e.target.value)}
          className={inputClass}
        >
          <option value="">All Districts</option>
          {[...new Set(events.map((e) => e.bezirk))].sort().map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={inputClass}
        >
          <option value="">All Types</option>
          {[...new Set(events.map((e) => e.event_type))].sort().map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className={inputClass}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Filters row 2: date range */}
      <div className="flex gap-2 flex-wrap items-center">
        <label className="text-xs text-text-light">From:</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className={inputClass}
        />
        <label className="text-xs text-text-light">To:</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className={inputClass}
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); }}
            className="text-xs text-text-light hover:text-text cursor-pointer"
          >
            Clear dates
          </button>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-2 bg-primary/5 rounded-xl">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <Button size="sm" variant="secondary" onClick={handleBulkToggle}>
            Toggle Active
          </Button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-text-light hover:text-text cursor-pointer"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-light border-b border-gray-200">
              <th className="py-2 px-2 text-center">
                <input
                  type="checkbox"
                  checked={selected.size === filteredEvents.length && filteredEvents.length > 0}
                  onChange={toggleSelectAll}
                  className="accent-primary cursor-pointer"
                />
              </th>
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
            {filteredEvents.map((event) => (
              <tr
                key={event.id}
                onClick={() => onEdit(event)}
                className={`border-b border-gray-100 hover:bg-primary/5 cursor-pointer ${
                  selected.has(event.id) ? "bg-primary/5" : ""
                }`}
              >
                <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(event.id)}
                    onChange={() => toggleSelect(event.id)}
                    className="accent-primary cursor-pointer"
                  />
                </td>
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
        {filteredEvents.length === 0 && (
          <p className="text-sm text-text-light text-center py-4">No events found</p>
        )}
      </div>
    </div>
  );
}
