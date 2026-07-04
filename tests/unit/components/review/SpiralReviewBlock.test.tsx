import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpiralReviewBlock } from "@/components/review/SpiralReviewBlock";
import { useSpiralReview } from "@/lib/hooks/useSpiralReview";
import type { Exercise } from "@/lib/types";
import { testIds } from "@/lib/testIds";

vi.mock("@/lib/hooks/useSpiralReview", () => ({ useSpiralReview: vi.fn() }));
vi.mock("@/lib/hooks/useAdminTtsEnabled", () => ({
  useAdminTtsEnabled: () => ({ ttsEnabled: false, hydrated: true }),
}));
vi.mock("@/lib/tts/engine", () => ({
  isTtsSupported: vi.fn(() => true),
  isEnglishVoiceAvailable: vi.fn(() => true),
  speakHebrew: vi.fn(),
  speakEnglish: vi.fn(),
  speakHebrewChunks: vi.fn(),
  autoSpeakHebrew: vi.fn(),
  autoSpeakHebrewChunks: vi.fn(),
  unlockAudioPlayback: vi.fn(),
  isAudioPlaybackUnlocked: vi.fn(() => false),
  stopSpeech: vi.fn(),
}));

const meta = { skillTags: [], difficulty: 1, representation: "abstract" } as const;
const exercise = { id: "day-1-section-1-exercise-1", kind: "number_input", prompt: "שאלה", answer: 4, meta } as Exercise;

function mockReview(value: { candidates: unknown[]; isHydrated: boolean }) {
  vi.mocked(useSpiralReview).mockReturnValue({
    candidates: value.candidates,
    record: vi.fn(),
    isHydrated: value.isHydrated,
  } as unknown as ReturnType<typeof useSpiralReview>);
}

const root = testIds.screen.section.spiralReview.root("a", "day-1", "day-1-section-1");

beforeEach(() => vi.clearAllMocks());

describe("SpiralReviewBlock", () => {
  it("renders nothing until the review overlay has hydrated", () => {
    mockReview({ candidates: [{ exercise }], isHydrated: false });
    render(<SpiralReviewBlock grade="a" dayId="day-1" sectionId="day-1-section-1" />);
    expect(screen.queryByTestId(root)).toBeNull();
  });

  it("renders nothing when there are no due candidates", () => {
    mockReview({ candidates: [], isHydrated: true });
    render(<SpiralReviewBlock grade="a" dayId="day-1" sectionId="day-1-section-1" />);
    expect(screen.queryByTestId(root)).toBeNull();
  });

  it("renders the review block with one exercise per due candidate", () => {
    mockReview({ candidates: [{ exercise }], isHydrated: true });
    render(<SpiralReviewBlock grade="a" dayId="day-1" sectionId="day-1-section-1" />);
    expect(screen.getByTestId(root)).toBeInTheDocument();
    expect(
      screen.getByTestId(testIds.screen.section.spiralReview.exercise("a", "day-1", "day-1-section-1", exercise.id)),
    ).toBeInTheDocument();
  });
});
