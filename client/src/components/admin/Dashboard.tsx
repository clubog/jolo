import { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { getStats } from "../../api/events";
import type { AdminStats } from "../../types";

export function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    getStats().then(setStats).catch(console.error);
  }, []);

  if (!stats) return <p className="text-center py-8">Loading stats...</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="text-3xl font-bold text-primary">{stats.total}</div>
          <div className="text-sm text-text-light">Active Events</div>
        </Card>
        <Card>
          <div className="text-3xl font-bold text-secondary">
            {stats.byBezirk.length}
          </div>
          <div className="text-sm text-text-light">Districts</div>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold mb-3">Events by Date</h3>
        <div className="space-y-1.5">
          {stats.byDate.map((d) => (
            <div key={d.date} className="flex justify-between text-sm">
              <span>{d.date}</span>
              <span className="font-semibold">{d.count}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-bold mb-3">Events by District</h3>
        <div className="space-y-1.5">
          {stats.byBezirk.map((b) => (
            <div key={b.bezirk} className="flex justify-between text-sm">
              <span>{b.bezirk}</span>
              <span className="font-semibold">{b.count}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-bold mb-3">Events by Type</h3>
        <div className="space-y-1.5">
          {stats.byType.map((t) => (
            <div key={t.event_type} className="flex justify-between text-sm">
              <span>{t.event_type}</span>
              <span className="font-semibold">{t.count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
