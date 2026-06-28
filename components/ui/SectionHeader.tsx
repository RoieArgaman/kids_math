import { childTid } from "@/lib/testIds";

export type SectionHeaderAlign = "center" | "right";

export type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  align?: SectionHeaderAlign;
  "data-testid"?: string;
  /**
   * Explicit child testids. Lets adopting screens keep their exact existing
   * ids when the title/subtitle ids were derived from a different base than the
   * header element itself. When omitted, they fall back to `childTid(testId,…)`.
   */
  titleTestId?: string;
  subtitleTestId?: string;
};

/**
 * Compact title + optional subtitle header. Reproduces the parent-dashboard
 * snapshot header exactly:
 *   header.mb-4.text-center
 *     > h2.text-xl.font-bold.text-[#2c2348]
 *     > p.mt-1.text-sm.text-[#8a8298]
 */
export function SectionHeader({
  title,
  subtitle,
  align = "center",
  "data-testid": testId,
  titleTestId,
  subtitleTestId,
}: SectionHeaderProps) {
  const alignClass = align === "right" ? "text-right" : "text-center";
  const resolvedTitleTid = titleTestId ?? (testId ? childTid(testId, "title") : undefined);
  const resolvedSubtitleTid = subtitleTestId ?? (testId ? childTid(testId, "subtitle") : undefined);
  return (
    <header data-testid={testId} className={`mb-4 ${alignClass}`}>
      <h2 data-testid={resolvedTitleTid} className="text-xl font-bold text-[#2c2348]">
        {title}
      </h2>
      {subtitle ? (
        <p data-testid={resolvedSubtitleTid} className="mt-1 text-sm text-[#8a8298]">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
