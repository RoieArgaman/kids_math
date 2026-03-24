interface StarRewardProps {
  visible: boolean;
  text?: string;
  onConfirm: () => void;
}

const CONFETTI_PARTICLES = Array.from({ length: 14 }, (_, i) => i);

export function StarReward({ visible, text, onConfirm }: StarRewardProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="star-reward-overlay" role="presentation">
      <div
        className="star-reward-modal surface"
        role="dialog"
        aria-modal="true"
        aria-labelledby="star-reward-title"
      >
        <div className="star-reward-confetti" aria-hidden>
          {CONFETTI_PARTICLES.map((particle) => (
            <span
              key={particle}
              className={`star-reward-confetti-piece star-reward-confetti-piece-${(particle % 7) + 1}`}
            />
          ))}
        </div>
        <div className="text-4xl" aria-hidden>
          ⭐⭐⭐
        </div>
        <p id="star-reward-title" className="mt-2 text-xl font-extrabold">
          כָּל הַכָּבוֹד!
        </p>
        <p className="mt-2 text-base font-semibold">
          {text ?? "הִשְׁלַמְתֶּם אֶת הַיּוֹם בְּהַצְלָחָה."}
        </p>
        <button type="button" className="touch-button btn-accent mt-5 w-full" onClick={onConfirm}>
          מְצֻיָּן, מְאַשְּׁרִים!
        </button>
      </div>
    </div>
  );
}
