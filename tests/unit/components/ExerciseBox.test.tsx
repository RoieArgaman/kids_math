import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseBox } from "@/components/ExerciseBox";
import type { Exercise } from "@/lib/types";
import { childTid, testIds } from "@/lib/testIds";
import { autoSpeakHebrew } from "@/lib/tts/engine";

// Auto-play is gated only by the admin master switch now (no student toggle); flip
// this per test to exercise both branches.
let mockAdminTtsEnabled = false;
vi.mock("@/lib/hooks/useAdminTtsEnabled", () => ({
  useAdminTtsEnabled: () => ({ ttsEnabled: mockAdminTtsEnabled, hydrated: true }),
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

beforeEach(() => {
  mockAdminTtsEnabled = false;
  vi.mocked(autoSpeakHebrew).mockClear();
});

const EX = "day-1-section-1-exercise-1";
const meta = { skillTags: [], difficulty: 1, representation: "abstract" } as const;
// Pure-text prompt (no math expression) so the whole string renders in the prompt
// paragraph — resolvePromptParts would otherwise split a "2+2" into a separate math line.
const exercise = { id: EX, kind: "number_input", prompt: "מהו הסכום הנכון?", answer: 4, meta } as Exercise;
const BASE = testIds.component.exerciseBox.root(EX);

const noop = {
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  onNextInput: vi.fn(),
  onRetry: vi.fn(),
  onRevealHint: vi.fn(),
};

describe("ExerciseBox", () => {
  it("renders the prompt, the input and the check button", () => {
    render(<ExerciseBox exercise={exercise} value="" {...noop} />);
    expect(screen.getByTestId(childTid(BASE, "prompt"))).toHaveTextContent("מהו הסכום הנכון?");
    expect(screen.getByTestId(testIds.component.exerciseBox.input(EX))).toBeInTheDocument();
    expect(screen.getByTestId(testIds.component.exerciseBox.check(EX))).toBeInTheDocument();
  });

  it("submits on the check button", async () => {
    const onSubmit = vi.fn();
    render(<ExerciseBox exercise={exercise} value="" {...noop} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByTestId(testIds.component.exerciseBox.check(EX)));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("hides the check button when showCheckButton is false", () => {
    render(<ExerciseBox exercise={exercise} value="" {...noop} showCheckButton={false} />);
    expect(screen.queryByTestId(testIds.component.exerciseBox.check(EX))).toBeNull();
  });

  it("offers a hint button after 2 wrong attempts", () => {
    render(<ExerciseBox exercise={exercise} value="5" {...noop} wasChecked wrongAttempts={2} isCorrect={false} />);
    expect(screen.getByTestId(testIds.component.exerciseBox.hint(EX))).toBeInTheDocument();
  });

  it("shows retry feedback for a wrong answer", () => {
    render(
      <ExerciseBox exercise={exercise} value="5" {...noop} wasChecked isCorrect={false} retryMessage="לא מדויק, נסו שוב" />,
    );
    expect(screen.getByTestId(childTid(BASE, "feedback"))).toHaveTextContent("לא מדויק");
    expect(screen.getByTestId(testIds.component.exerciseBox.retry(EX))).toBeInTheDocument();
  });

  it("requests prompt auto-play on mount when admin TTS is enabled (no student toggle needed)", () => {
    mockAdminTtsEnabled = true;
    render(<ExerciseBox exercise={exercise} value="" {...noop} />);
    // autoSpeakHebrew defers until the audio-unlock gesture, so it's the auto-play entry point.
    expect(autoSpeakHebrew).toHaveBeenCalledTimes(1);
  });

  it("does not auto-play when admin TTS is disabled", () => {
    mockAdminTtsEnabled = false;
    render(<ExerciseBox exercise={exercise} value="" {...noop} />);
    expect(autoSpeakHebrew).not.toHaveBeenCalled();
  });
});
