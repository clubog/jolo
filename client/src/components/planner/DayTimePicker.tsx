import { TIME_BLOCKS } from "../../config/constants";
import { Chip } from "../ui/Chip";
import type { TimeBlock } from "../../types";

interface Props {
  date: string;
  timeBlocks: TimeBlock[];
  onDateChange: (date: string) => void;
  onToggleTimeBlock: (block: TimeBlock) => void;
}

function getDateChips(): { value: string; label: string; sub: string }[] {
  const chips = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const value = d.toISOString().slice(0, 10);
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    const day = d.getDate();
    const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : weekday;
    chips.push({ value, label, sub: `${day}` });
  }
  return chips;
}

export function DayTimePicker({
  date,
  timeBlocks,
  onDateChange,
  onToggleTimeBlock,
}: Props) {
  const dateChips = getDateChips();

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-center">When are you free?</h2>

      {/* Date chips — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {dateChips.map((chip) => (
          <button
            key={chip.value}
            onClick={() => onDateChange(chip.value)}
            className={`flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-2xl text-sm font-semibold transition-all cursor-pointer
              ${
                date === chip.value
                  ? "bg-primary text-white shadow-md"
                  : "bg-surface text-text-light border border-gray-200 hover:border-primary"
              }`}
          >
            <span className="text-xs">{chip.label}</span>
            <span className="text-lg font-bold">{chip.sub}</span>
          </button>
        ))}
      </div>

      {/* Time block pills */}
      <div className="flex justify-center gap-3">
        {(Object.entries(TIME_BLOCKS) as [TimeBlock, typeof TIME_BLOCKS[keyof typeof TIME_BLOCKS]][]).map(
          ([key, block]) => (
            <div key={key} className="text-center">
              <Chip
                label={`${block.emoji} ${block.label}`}
                selected={timeBlocks.includes(key)}
                onClick={() => onToggleTimeBlock(key)}
              />
              {timeBlocks.includes(key) && (
                <div className="text-xs text-text-light mt-1">{block.range}</div>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
