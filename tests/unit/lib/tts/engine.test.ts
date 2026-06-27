import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHILD_TTS_RATE } from "@/lib/tts/constants";
import {
  isTtsSupported,
  normalizeTextForHebrewTts,
  speakHebrew,
  speakHebrewChunks,
  stopSpeech,
} from "@/lib/tts/engine";

/** Matches dash class in `lib/tts/engine.ts` — keep in sync for regression coverage. */
const DASH_CODEPOINTS: readonly { label: string; dash: string }[] = [
  { label: "U+002D hyphen-minus", dash: "-" },
  { label: "U+05BE Hebrew maqaf", dash: "\u05BE" },
  { label: "U+2212 minus sign", dash: "\u2212" },
  { label: "U+2010 hyphen", dash: "\u2010" },
  { label: "U+2011 non-breaking hyphen", dash: "\u2011" },
  { label: "U+2012 figure dash", dash: "\u2012" },
  { label: "U+2013 en dash", dash: "\u2013" },
  { label: "U+2014 em dash", dash: "\u2014" },
  { label: "U+2015 horizontal bar", dash: "\u2015" },
];

describe("tts engine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    // @ts-expect-error cleanup
    delete window.speechSynthesis;
    // @ts-expect-error cleanup
    delete window.SpeechSynthesisUtterance;
  });

  it("isTtsSupported is false when API missing", () => {
    // @ts-expect-error test
    delete window.speechSynthesis;
    expect(isTtsSupported()).toBe(false);
  });

  it("speakHebrew no-ops when unsupported", () => {
    // @ts-expect-error test
    delete window.speechSynthesis;
    speakHebrew("שלום");
    expect(true).toBe(true);
  });

  it.each(DASH_CODEPOINTS)(
    "normalizeTextForHebrewTts inserts space for %s between Hebrew letter and digit",
    ({ dash }) => {
      expect(normalizeTextForHebrewTts(`מ${dash}1`)).toBe("מ 1");
    },
  );

  it("normalizeTextForHebrewTts: warm-up style real prompt (ASCII dash)", () => {
    expect(normalizeTextForHebrewTts("חִימּוּם מֵ-1 עַד 4")).toBe("חִימּוּם מֵ 1 עַד 4");
  });

  it("normalizeTextForHebrewTts inserts space before multi-digit run", () => {
    expect(normalizeTextForHebrewTts("מ-12")).toBe("מ 12");
  });

  it("normalizeTextForHebrewTts fixes multiple Hebrew-dash-digit segments", () => {
    expect(normalizeTextForHebrewTts("מ-1 וגם מ-2")).toBe("מ 1 וגם מ 2");
  });

  it("normalizeTextForHebrewTts leaves digit-minus-digit unchanged", () => {
    expect(normalizeTextForHebrewTts("5-3")).toBe("5-3");
  });

  it("normalizeTextForHebrewTts leaves Latin letter before dash unchanged", () => {
    expect(normalizeTextForHebrewTts("a-1")).toBe("a-1");
  });

  it("normalizeTextForHebrewTts leaves Hebrew-dash-non-digit unchanged (no ASCII digit after dash)", () => {
    expect(normalizeTextForHebrewTts("מֵ-א")).toBe("מֵ-א");
  });

  it("normalizeTextForHebrewTts speaks the less-than sign", () => {
    expect(normalizeTextForHebrewTts("5 < 8")).toBe("5  קָטָן מִ  8");
  });

  it("normalizeTextForHebrewTts speaks the greater-than sign", () => {
    expect(normalizeTextForHebrewTts("8 > 5")).toBe("8  גָּדוֹל מִ  5");
  });

  it("normalizeTextForHebrewTts speaks the division sign", () => {
    expect(normalizeTextForHebrewTts("10 ÷ 2")).toBe("10  חֶלְקֵי  2");
  });

  it("stopSpeech does not throw without synthesis", () => {
    // @ts-expect-error test
    delete window.speechSynthesis;
    expect(() => stopSpeech()).not.toThrow();
  });

  it("speakHebrew does not cancel when synthesis queue is idle", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const resume = vi.fn();
    const getVoices = vi.fn(() => [] as SpeechSynthesisVoice[]);
    const addEventListener = vi.fn();

    class MockUtterance {
      text: string;
      lang = "";
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }

    // @ts-expect-error test mock
    window.speechSynthesis = {
      speak,
      cancel,
      resume,
      getVoices,
      addEventListener,
      speaking: false,
      pending: false,
    };
    // @ts-expect-error test mock
    window.SpeechSynthesisUtterance = MockUtterance as unknown as typeof SpeechSynthesisUtterance;

    speakHebrew("שלום");

    expect(cancel).not.toHaveBeenCalled();
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it("speakHebrew cancels and defers when synthesis is already active", async () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const resume = vi.fn();
    const getVoices = vi.fn(() => [] as SpeechSynthesisVoice[]);
    const addEventListener = vi.fn();

    class MockUtterance {
      text: string;
      lang = "";
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }

    // @ts-expect-error test mock
    window.speechSynthesis = {
      speak,
      cancel,
      resume,
      getVoices,
      addEventListener,
      speaking: true,
      pending: false,
    };
    // @ts-expect-error test mock
    window.SpeechSynthesisUtterance = MockUtterance as unknown as typeof SpeechSynthesisUtterance;

    speakHebrew("שלום");
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(speak).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it("speakHebrew passes trimmed, normalized text to SpeechSynthesisUtterance", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const resume = vi.fn();
    const getVoices = vi.fn(() => [] as SpeechSynthesisVoice[]);
    const addEventListener = vi.fn();

    class MockUtterance {
      text: string;
      lang = "";
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }

    // @ts-expect-error test mock
    window.speechSynthesis = { speak, cancel, resume, getVoices, addEventListener };
    // @ts-expect-error test mock
    window.SpeechSynthesisUtterance = MockUtterance as unknown as typeof SpeechSynthesisUtterance;

    speakHebrew("  מֵ-1   עַד 4  ");

    expect(speak).toHaveBeenCalledTimes(1);
    const utterance = speak.mock.calls[0][0] as MockUtterance;
    expect(utterance.text).toBe("מֵ 1 עַד 4");
    expect(utterance.lang).toBe("he-IL");
    expect(utterance.rate).toBe(CHILD_TTS_RATE);
  });

  it("speakHebrewChunks speaks each part with child rate", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const resume = vi.fn();
    const getVoices = vi.fn(() => [] as SpeechSynthesisVoice[]);
    const addEventListener = vi.fn();

    class MockUtterance {
      text: string;
      lang = "";
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }

    // @ts-expect-error test mock
    window.speechSynthesis = { speak, cancel, resume, getVoices, addEventListener };
    // @ts-expect-error test mock
    window.SpeechSynthesisUtterance = MockUtterance as unknown as typeof SpeechSynthesisUtterance;

    const onEnd = vi.fn();
    speakHebrewChunks(["א", "ב"], onEnd);
    expect(speak).toHaveBeenCalledTimes(1);
    const first = speak.mock.calls[0][0] as MockUtterance;
    expect(first.rate).toBe(CHILD_TTS_RATE);
    first.onend?.();
    expect(speak).toHaveBeenCalledTimes(2);
    const second = speak.mock.calls[1][0] as MockUtterance;
    second.onend?.();
    expect(onEnd).toHaveBeenCalled();
  });
});
