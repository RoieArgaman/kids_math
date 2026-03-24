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
    <input
      className="underline-input"
      minLength={1}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onEnter();
        }
      }}
      placeholder={placeholder ?? "כִּתְבוּ תְּשׁוּבָה"}
      type="text"
      value={value}
    />
  );
}
