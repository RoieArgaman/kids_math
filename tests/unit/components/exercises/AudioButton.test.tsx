import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AudioButton } from "@/components/exercises/AudioButton";
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
  vi.mocked(engine.isEnglishVoiceAvailable).mockReturnValue(true);
  vi.mocked(engine.speakEnglish).mockReset();
});

describe("AudioButton", () => {
  it("renders a labeled English speaker and speaks English on click", async () => {
    render(<AudioButton data-testid="km.test.audio" text="cat" label="Listen" />);
    const btn = screen.getByTestId("km.test.audio");
    expect(btn).toHaveTextContent("Listen");
    await userEvent.click(btn);
    expect(engine.speakEnglish).toHaveBeenCalledWith("cat", expect.any(Function));
  });

  it("stays visible but disabled when no English voice is installed", () => {
    vi.mocked(engine.isEnglishVoiceAvailable).mockReturnValue(false);
    render(<AudioButton data-testid="km.test.audio" text="dog" />);
    expect(screen.getByTestId("km.test.audio")).toBeDisabled();
  });
});
