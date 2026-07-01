import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpeakerButton } from "@/components/ui/SpeakerButton";
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
  vi.mocked(engine.isEnglishVoiceAvailable).mockReturnValue(true);
  vi.mocked(engine.speakHebrew).mockReset();
  vi.mocked(engine.speakEnglish).mockReset();
  vi.mocked(engine.stopSpeech).mockReset();
});

describe("SpeakerButton (Hebrew / icon)", () => {
  it("renders an idle speaker icon button when TTS is supported", () => {
    render(<SpeakerButton lang="he" text="שלום" dataTestId="km.test.spk" />);
    const btn = screen.getByTestId("km.test.spk");
    expect(btn).toBeEnabled();
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("hides entirely (renders null) when Hebrew speech is unsupported", () => {
    vi.mocked(engine.isTtsSupported).mockReturnValue(false);
    render(<SpeakerButton lang="he" text="שלום" dataTestId="km.test.spk" />);
    expect(screen.queryByTestId("km.test.spk")).toBeNull();
  });

  it("speaks Hebrew on click and flips to the speaking (stop) state", async () => {
    render(<SpeakerButton lang="he" text="שלום" dataTestId="km.test.spk" />);
    await userEvent.click(screen.getByTestId("km.test.spk"));
    expect(engine.speakHebrew).toHaveBeenCalledWith("שלום", expect.any(Function));
    expect(screen.getByTestId("km.test.spk")).toHaveAttribute("aria-pressed", "true");
  });

  it("speaks chunks instead of a single utterance when chunks are provided", async () => {
    render(<SpeakerButton lang="he" chunks={["a", "b"]} dataTestId="km.test.spk" />);
    await userEvent.click(screen.getByTestId("km.test.spk"));
    expect(engine.speakHebrewChunks).toHaveBeenCalledWith(["a", "b"], expect.any(Function));
    expect(engine.speakHebrew).not.toHaveBeenCalled();
  });
});

describe("SpeakerButton (English / labeled)", () => {
  it("stays visible but disabled when no English voice exists", () => {
    vi.mocked(engine.isEnglishVoiceAvailable).mockReturnValue(false);
    render(<SpeakerButton lang="en" appearance="labeled" text="cat" label="Listen" dataTestId="km.test.en" />);
    const btn = screen.getByTestId("km.test.en");
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent("Listen");
  });

  it("speaks English on click when a voice is available", async () => {
    render(<SpeakerButton lang="en" appearance="labeled" text="cat" dataTestId="km.test.en" />);
    await userEvent.click(screen.getByTestId("km.test.en"));
    expect(engine.speakEnglish).toHaveBeenCalledWith("cat", expect.any(Function));
  });
});
