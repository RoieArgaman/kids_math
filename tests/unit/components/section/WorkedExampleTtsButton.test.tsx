import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkedExampleTtsButton } from "@/components/section/WorkedExampleTtsButton";
import type { WorkedExample } from "@/lib/types";
import * as speakText from "@/lib/utils/workedExampleSpeakText";
import { testIds } from "@/lib/testIds";

vi.mock("@/lib/tts/engine", () => ({
  isTtsSupported: vi.fn(() => true),
  isEnglishVoiceAvailable: vi.fn(() => true),
  speakHebrew: vi.fn(),
  speakEnglish: vi.fn(),
  speakHebrewChunks: vi.fn(),
  stopSpeech: vi.fn(),
}));
vi.mock("@/lib/utils/workedExampleSpeakText", () => ({
  buildWorkedExampleSpeakChunks: vi.fn(),
}));

const example = {} as WorkedExample;

beforeEach(() => vi.clearAllMocks());

describe("WorkedExampleTtsButton", () => {
  it("renders a tap-to-play button when there are speakable chunks", () => {
    vi.mocked(speakText.buildWorkedExampleSpeakChunks).mockReturnValue(["צעד ראשון", "צעד שני"]);
    render(<WorkedExampleTtsButton sectionId="day-1-section-1" example={example} />);
    expect(screen.getByTestId(testIds.component.sectionBlock.example.tts("day-1-section-1"))).toBeInTheDocument();
  });

  it("renders nothing when there is nothing to speak", () => {
    vi.mocked(speakText.buildWorkedExampleSpeakChunks).mockReturnValue([]);
    render(<WorkedExampleTtsButton sectionId="day-1-section-1" example={example} />);
    expect(screen.queryByTestId(testIds.component.sectionBlock.example.tts("day-1-section-1"))).toBeNull();
  });
});
