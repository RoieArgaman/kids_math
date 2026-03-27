import { testIds } from "@/lib/testIds";

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
    <div data-testid={testIds.component.starReward.overlay()} className="star-reward-overlay" role="presentation">
      <div
        data-testid={testIds.component.starReward.dialog()}
        className="star-reward-modal w-full max-w-md rounded-3xl p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="star-reward-title"
        style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef9c3 50%, #fef3c7 100%)" }}
      >
        <div data-testid="km.autogen.starreward.node.idx.2" className="star-reward-confetti" aria-hidden>
          {CONFETTI_PARTICLES.map((particle) => (
            <span data-testid="km.autogen.starreward.node.idx.3"
              key={particle}
              className={`star-reward-confetti-piece star-reward-confetti-piece-${(particle % 14) + 1}`}
            />
          ))}
        </div>
        <div data-testid="km.autogen.starreward.node.idx.4" className="star-pop text-6xl" aria-hidden>
          ⭐⭐⭐⭐⭐
        </div>
        <p data-testid="km.autogen.starreward.node.idx.5" id="star-reward-title" className="mt-3 text-2xl font-extrabold text-purple-700">
          כָּל הַכָּבוֹד!
        </p>
        <p data-testid="km.autogen.starreward.node.idx.6" className="mt-1 text-lg font-bold text-amber-600">אַתָּה אַלּוּף! 🏆</p>
        <p data-testid="km.autogen.starreward.node.idx.7" className="mt-2 text-base font-semibold text-slate-700">
          {text ?? "הִשְׁלַמְתֶּם אֶת הַיּוֹם בְּהַצְלָחָה."}
        </p>
        <button
          data-testid={testIds.component.starReward.confirm()}
          type="button"
          className="touch-button btn-accent mt-6 w-full text-lg"
          onClick={onConfirm}
        >
          🎉 מְצֻיָּן, מְאַשְּׁרִים!
        </button>
      </div>
    </div>
  );
}
