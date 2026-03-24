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
      <div className="flex items-center justify-between gap-2">
        {points.map((point) => (
          <div key={point} className="flex flex-1 flex-col items-center">
            <div className="h-3 w-px bg-slate-500" />
            <span className="mt-1 text-xs">{point}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
