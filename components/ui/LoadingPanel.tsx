import { childTid, testIds } from "@/lib/testIds";

const defaultCardClass =
  "surface mx-auto max-w-sm rounded-panel p-8 text-center shadow-lg";

export type LoadingPanelProps = {
  emoji?: string;
  title: string;
  className?: string;
  /** Screens that already own a loading testid pass it here, so their id survives
   *  the move off bespoke loading markup (roadmap 3.5.4b). */
  "data-testid"?: string;
};

export function LoadingPanel({ emoji, title, className, "data-testid": testId }: LoadingPanelProps) {
  const merged =
    className !== undefined && className !== ""
      ? `${defaultCardClass} ${className}`.trim()
      : defaultCardClass;

  return (
    <div data-testid={testId ?? testIds.component.loadingPanel.root()} className={merged}>
      {emoji ? (
        <p
          data-testid={testId ? childTid(testId, "emoji") : testIds.component.loadingPanel.emoji()}
          className="mb-2 text-5xl"
          aria-hidden
        >
          {emoji}
        </p>
      ) : null}
      <p
        data-testid={testId ? childTid(testId, "title") : testIds.component.loadingPanel.title()}
        className="text-lg font-semibold text-[var(--muted)]"
      >
        {title}
      </p>
    </div>
  );
}
