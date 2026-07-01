import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TapToPlayTtsButton } from "@/components/ui/TapToPlayTtsButton";
import * as engine from "@/lib/tts/engine";

vi.mock("@/lib/tts/engine", () => ({
  isTtsSupported: vi.fn(() => true),
  isEnglishVoiceAvailable: vi.fn(() => true),
  speakHebrew: vi.fn(),
  speakEnglish: vi.fn(),
  speakHebrewChunks: vi.fn(),
  stopSpeech: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(engine.isTtsSupported).mockReturnValue(true);
  vi.mocked(engine.speakHebrew).mockReset();
});

describe("TapToPlayTtsButton", () => {
  it("renders the Hebrew icon button and speaks Hebrew on tap", async () => {
    render(<TapToPlayTtsButton text="חמש ועוד שלוש" dataTestId="km.test.tap" />);
    const btn = screen.getByTestId("km.test.tap");
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(engine.speakHebrew).toHaveBeenCalledWith("חמש ועוד שלוש", expect.any(Function));
  });

  it("is hidden when Hebrew speech is unsupported (printed prompt still shows elsewhere)", () => {
    vi.mocked(engine.isTtsSupported).mockReturnValue(false);
    render(<TapToPlayTtsButton text="x" dataTestId="km.test.tap" />);
    expect(screen.queryByTestId("km.test.tap")).toBeNull();
  });
});
