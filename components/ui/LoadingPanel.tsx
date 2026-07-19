import { childTid } from "@/lib/testIds";

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
    <div data-testid={testId ?? "km.autogen.loadingpanel.node.idx.0"} className={merged}>
      {emoji ? (
        <p
          data-testid={testId ? childTid(testId, "emoji") : "km.autogen.loadingpanel.node.idx.1"}
          className="mb-2 text-5xl"
          aria-hidden
        >
          {emoji}
        </p>
      ) : null}
      <p
        data-testid={testId ? childTid(testId, "title") : "km.autogen.loadingpanel.node.idx.2"}
        className="text-lg font-semibold text-[var(--muted)]"
      >
        {title}
      </p>
    </div>
  );
}
