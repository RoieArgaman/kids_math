import { childTid, testIds } from "@/lib/testIds";
import { BADGE_DEFINITIONS_MAP } from "@/lib/badges/definitions";
import type { BadgeId } from "@/lib/badges/types";

interface TrophyUnlockProps {
  visible: boolean;
  newBadgeIds: BadgeId[];
  onConfirm: () => void;
}

const CONFETTI_PARTICLES = Array.from({ length: 14 }, (_, i) => i);

export function TrophyUnlock({ visible, newBadgeIds, onConfirm }: TrophyUnlockProps) {
  if (!visible) {
    return null;
  }

  const dialogTid = testIds.component.trophyUnlock.dialog();

  return (
    <div data-testid={testIds.component.trophyUnlock.overlay()} className="star-reward-overlay" role="presentation">
      <div
        data-testid={dialogTid}
        className="star-reward-modal w-full max-w-md rounded-3xl p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trophy-unlock-title"
        style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef9c3 50%, #fef3c7 100%)" }}
      >
        <div data-testid={childTid(dialogTid, "confetti")} className="star-reward-confetti" aria-hidden>
          {CONFETTI_PARTICLES.map((particle) => (
            <span
              key={particle}
              data-testid={childTid(dialogTid, "confetti", particle)}
              className={`star-reward-confetti-piece star-reward-confetti-piece-${(particle % 14) + 1}`}
            />
          ))}
        </div>
        <div data-testid={childTid(dialogTid, "emoji")} className="star-pop text-6xl" aria-hidden>
          🏆
        </div>
        <p
          id="trophy-unlock-title"
          data-testid={childTid(dialogTid, "title")}
          className="mt-3 text-2xl font-extrabold text-purple-700"
        >
          פְּרָס חָדָשׁ!
        </p>
        <p data-testid={childTid(dialogTid, "subtitle")} className="mt-1 text-lg font-bold text-amber-600">
          הֶשֵּׂגְתָּ תְּגָמוּל חָדָשׁ!
        </p>
        <div data-testid={childTid(dialogTid, "badgeList")} className="mt-4 flex flex-col gap-2">
          {newBadgeIds.map((id) => {
            const badge = BADGE_DEFINITIONS_MAP[id];
            if (!badge) return null;
            return (
              <div
                key={id}
                data-testid={childTid(dialogTid, "badgeRow", id)}
                className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm"
              >
                <span data-testid={childTid(dialogTid, "badgeRow", id, "icon")} className="text-3xl">
                  {badge.icon}
                </span>
                <span data-testid={childTid(dialogTid, "badgeRow", id, "name")} className="font-bold text-slate-800">
                  {badge.name}
                </span>
              </div>
            );
          })}
        </div>
        <button
          data-testid={testIds.component.trophyUnlock.confirm()}
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
