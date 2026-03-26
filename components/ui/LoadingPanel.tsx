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
    <div className={merged}>
      {emoji ? <p className="mb-2 text-5xl">{emoji}</p> : null}
      <p className="text-lg font-semibold text-gray-700">{title}</p>
    </div>
  );
}
