type TeachingPrimerExpandToggleProps = {
  expanded: boolean;
  testId: string;
  onToggle: () => void;
};

export function TeachingPrimerExpandToggle({ expanded, testId, onToggle }: TeachingPrimerExpandToggleProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      className="touch-button mt-3 w-full rounded-2xl border border-amber-300 bg-white py-3 text-sm font-semibold text-amber-950 shadow-sm"
      aria-expanded={expanded}
      onClick={onToggle}
    >
      {expanded ? "צָמְצוּם הַהַסְבָּר" : "הַרְחֵב אֶת הַהַסְבָּר"}
    </button>
  );
}
