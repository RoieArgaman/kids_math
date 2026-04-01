import type { ReactNode } from "react";

type ShapeName = "circle" | "square" | "triangle" | "rectangle";

const SHAPE_SVGS: Record<ShapeName, ReactNode> = {
  circle: (
    <svg viewBox="0 0 80 80" className="h-16 w-16" aria-hidden="true">
      <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="4" />
    </svg>
  ),
  square: (
    <svg viewBox="0 0 80 80" className="h-16 w-16" aria-hidden="true">
      <rect x="10" y="10" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="4" />
    </svg>
  ),
  triangle: (
    <svg viewBox="0 0 80 80" className="h-16 w-16" aria-hidden="true">
      <polygon points="40,8 74,72 6,72" fill="none" stroke="currentColor" strokeWidth="4" />
    </svg>
  ),
  rectangle: (
    <svg viewBox="0 0 100 70" className="h-14 w-20" aria-hidden="true">
      <rect x="6" y="6" width="88" height="58" fill="none" stroke="currentColor" strokeWidth="4" />
    </svg>
  ),
};

const SHAPE_LABELS: Record<ShapeName, string> = {
  circle: "עִיגּוּל",
  square: "רִיבּוּעַ",
  triangle: "מְשֻׁלָּשׁ",
  rectangle: "מַלְבֵּן",
};

function isShapeName(value: string): value is ShapeName {
  return value in SHAPE_SVGS;
}

interface ShapeIconProps {
  shape: string;
}

export function ShapeIcon({ shape }: ShapeIconProps) {
  if (!isShapeName(shape)) return <span>{shape}</span>;

  return (
    <span className="inline-flex flex-col items-center gap-1" role="img" aria-label={SHAPE_LABELS[shape]}>
      {SHAPE_SVGS[shape]}
    </span>
  );
}
