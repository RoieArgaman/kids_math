import { testIds } from "@/lib/testIds";

interface NumberLineProps {
  start: number;
  end: number;
}

export function NumberLine({ start, end }: NumberLineProps) {
  const min = Math.min(start, end);
  const max = Math.max(start, end);
  const points = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div data-testid={testIds.component.numberLine.root()} className="rounded-2xl border border-[#cde4f3] bg-[#f5fbff] p-3" dir="ltr">
      <div data-testid={testIds.component.numberLine.row()} className="relative flex items-end justify-between gap-2">
        <div data-testid={testIds.component.numberLine.axis()}
          className="pointer-events-none absolute bottom-[calc(1rem+2px)] left-0 right-0 h-0.5 bg-[#9cc6e0]"
          aria-hidden="true"
        />
        {points.map((point) => (
          <div data-testid={testIds.component.numberLine.point()} key={point} className="relative flex flex-1 flex-col items-center">
            <div data-testid={testIds.component.numberLine.pointTick()} className="h-4 w-0.5 bg-[#5b9fcc]" />
            <span data-testid={testIds.component.numberLine.pointLabel()} className="mt-1 text-sm font-bold text-[#0c4a6e]">{point}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
