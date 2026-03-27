const defaultCardClass =
  "surface mx-auto max-w-sm rounded-3xl p-8 text-center shadow-lg";

export type LoadingPanelProps = {
  emoji?: string;
  title: string;
  className?: string;
};

export function LoadingPanel({ emoji, title, className }: LoadingPanelProps) {
  const merged =
    className !== undefined && className !== ""
      ? `${defaultCardClass} ${className}`.trim()
      : defaultCardClass;

  return (
    <div data-testid="km.autogen.loadingpanel.node.idx.0" className={merged}>
      {emoji ? <p data-testid="km.autogen.loadingpanel.node.idx.1" className="mb-2 text-5xl">{emoji}</p> : null}
      <p data-testid="km.autogen.loadingpanel.node.idx.2" className="text-lg font-semibold text-gray-700">{title}</p>
    </div>
  );
}
