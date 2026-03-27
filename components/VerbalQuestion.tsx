interface VerbalQuestionProps {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  placeholder?: string;
  ariaLabel?: string;
  "data-testid"?: string;
  "data-exercise-focus"?: string;
}

export function VerbalQuestion({
  value,
  onChange,
  onEnter,
  placeholder,
  ariaLabel,
  "data-testid": dataTestId,
  "data-exercise-focus": dataExerciseFocus,
}: VerbalQuestionProps) {
  return (
    <div data-testid="km.autogen.verbalquestion.node.idx.0" className="relative mt-2 flex items-center gap-2">
      <span data-testid="km.autogen.verbalquestion.node.idx.1" className="text-xl" aria-hidden="true">📝</span>
      <input
        data-testid={dataTestId ?? "km.autogen.verbalquestion.node.idx.2"}
        data-exercise-focus={dataExerciseFocus}
        aria-label={ariaLabel}
        className="underline-input flex-1 text-lg"
        minLength={1}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onEnter();
          }
        }}
        placeholder={placeholder ?? "כִּתְבוּ תְּשׁוּבָה"}
        type="text"
        value={value}
      />
    </div>
  );
}
