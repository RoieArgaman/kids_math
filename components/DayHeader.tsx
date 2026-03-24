import type { WorkbookDay } from "@/lib/types";

interface DayHeaderProps {
  day: WorkbookDay;
}

export function DayHeader({ day }: DayHeaderProps) {
  return (
    <header className="mb-4 surface p-4">
      <p className="muted text-sm">שָׁבוּעַ {day.week}</p>
      <h1 className="mt-1 text-2xl font-bold">
        יוֹם {day.dayNumber}: {day.title}
      </h1>
      <p className="muted mt-2 text-sm">{day.objective}</p>
    </header>
  );
}
