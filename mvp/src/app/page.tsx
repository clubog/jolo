import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8 py-12">
      <div>
        <h1 className="font-display text-[28px]">Berlin Event Planner</h1>
        <p className="text-ink-light mt-2">
          Personalized day-by-day schedules for Feb 16–22, 2026
        </p>
      </div>

      <div className="grid gap-4">
        <Link
          href="/plan"
          className="block p-6 bg-terracotta text-white rounded-full text-center hover:bg-terracotta/90 transition"
        >
          <h2 className="font-semibold text-lg">Start Planning</h2>
          <p className="text-sm text-white/80 mt-1">
            Pick a persona, set your mood, and get a personalized schedule
          </p>
        </Link>

        <Link
          href="/admin"
          className="block p-6 bg-surface rounded-2xl border border-border hover:border-terracotta transition"
        >
          <h2 className="font-semibold text-lg">Admin</h2>
          <p className="text-sm text-ink-light mt-1">
            Import events via JSON and manage the event dataset
          </p>
        </Link>
      </div>
    </div>
  );
}
