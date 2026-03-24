interface VerbalQuestionProps {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  placeholder?: string;
}

export function VerbalQuestion({
  value,
  onChange,
  onEnter,
  placeholder,
}: VerbalQuestionProps) {
  return (
    <div className="relative mt-2 flex items-center gap-2">
      <span className="text-xl" aria-hidden="true">📝</span>
      <input
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
