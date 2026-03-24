import type { WorkbookDay } from "@/lib/types";

interface DayHeaderProps {
  day: WorkbookDay;
}

const DAY_EMOJIS = ["🦁", "🐸", "🦋", "🌈", "🚀", "🎯", "🎨", "🎵", "🌟", "⭐", "🏆", "🎪", "🎭", "🎲"];

export function DayHeader({ day }: DayHeaderProps) {
  const emoji = DAY_EMOJIS[(day.dayNumber - 1) % DAY_EMOJIS.length];

  return (
    <header
      className="mb-4 rounded-3xl p-6"
      style={{ background: "linear-gradient(135deg, var(--accent) 0%, #818cf8 100%)" }}
    >
      <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs text-white">
        שָׁבוּעַ {day.week}
      </span>
      <h1 className="mt-3 text-3xl font-extrabold text-white">
        <span className="me-2" aria-hidden="true" style={{ unicodeBidi: "isolate" }}>{emoji}</span>
        יוֹם {day.dayNumber}: {day.title}
      </h1>
      <p className="mt-2 text-sm text-indigo-200">{day.objective}</p>
    </header>
  );
}
