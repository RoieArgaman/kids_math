import type { ReactNode } from "react";
import { testIds } from "@/lib/testIds";

type ShapeName = "circle" | "square" | "triangle" | "rectangle";

function shapeSvg(shape: ShapeName): ReactNode {
  const svgTid = testIds.component.shapeIcon.svg(shape);
  switch (shape) {
    case "circle":
      return (
        <svg data-testid={svgTid} viewBox="0 0 80 80" className="h-16 w-16" aria-hidden="true">
          <circle data-testid={`${svgTid}-path`} cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="4" />
        </svg>
      );
    case "square":
      return (
        <svg data-testid={svgTid} viewBox="0 0 80 80" className="h-16 w-16" aria-hidden="true">
          <rect data-testid={`${svgTid}-path`} x="10" y="10" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="4" />
        </svg>
      );
    case "triangle":
      return (
        <svg data-testid={svgTid} viewBox="0 0 80 80" className="h-16 w-16" aria-hidden="true">
          <polygon data-testid={`${svgTid}-path`} points="40,8 74,72 6,72" fill="none" stroke="currentColor" strokeWidth="4" />
        </svg>
      );
    case "rectangle":
      return (
        <svg data-testid={svgTid} viewBox="0 0 100 70" className="h-14 w-20" aria-hidden="true">
          <rect data-testid={`${svgTid}-path`} x="6" y="6" width="88" height="58" fill="none" stroke="currentColor" strokeWidth="4" />
        </svg>
      );
  }
}

const SHAPE_LABELS: Record<ShapeName, string> = {
  circle: "עִיגּוּל",
  square: "רִיבּוּעַ",
  triangle: "מְשֻׁלָּשׁ",
  rectangle: "מַלְבֵּן",
};

function isShapeName(value: string): value is ShapeName {
  return value in SHAPE_LABELS;
}

interface ShapeIconProps {
  shape: string;
}

export function ShapeIcon({ shape }: ShapeIconProps) {
  if (!isShapeName(shape)) return <span data-testid={testIds.component.shapeIcon.fallback()}>{shape}</span>;

  return (
    <span data-testid={testIds.component.shapeIcon.root(shape)} className="inline-flex flex-col items-center gap-1" role="img" aria-label={SHAPE_LABELS[shape]}>
      {shapeSvg(shape)}
    </span>
  );
}
