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
        className="star-reward-modal w-full max-w-md rounded-3xl p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="star-reward-title"
        style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef9c3 50%, #fef3c7 100%)" }}
      >
        <div className="star-reward-confetti" aria-hidden>
          {CONFETTI_PARTICLES.map((particle) => (
            <span
              key={particle}
              className={`star-reward-confetti-piece star-reward-confetti-piece-${(particle % 14) + 1}`}
            />
          ))}
        </div>
        <div className="star-pop text-6xl" aria-hidden>
          ⭐⭐⭐⭐⭐
        </div>
        <p id="star-reward-title" className="mt-3 text-2xl font-extrabold text-purple-700">
          כָּל הַכָּבוֹד!
        </p>
        <p className="mt-1 text-lg font-bold text-amber-600">אַתָּה אַלּוּף! 🏆</p>
        <p className="mt-2 text-base font-semibold text-slate-700">
          {text ?? "הִשְׁלַמְתֶּם אֶת הַיּוֹם בְּהַצְלָחָה."}
        </p>
        <button type="button" className="touch-button btn-accent mt-6 w-full text-lg" onClick={onConfirm}>
          🎉 מְצֻיָּן, מְאַשְּׁרִים!
        </button>
      </div>
    </div>
  );
}
