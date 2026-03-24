interface NumberLineProps {
  start: number;
  end: number;
}

export function NumberLine({ start, end }: NumberLineProps) {
  const min = Math.min(start, end);
  const max = Math.max(start, end);
  const points = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="surface p-3" dir="ltr">
      <div className="relative flex items-end justify-between gap-2">
        <div
          className="pointer-events-none absolute bottom-[calc(1rem+2px)] left-0 right-0 h-0.5 bg-slate-400"
          aria-hidden="true"
        />
        {points.map((point) => (
          <div key={point} className="relative flex flex-1 flex-col items-center">
            <div className="h-4 w-0.5 bg-slate-500" />
            <span className="mt-1 text-sm font-semibold">{point}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
