import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHILD_TTS_RATE } from "@/lib/tts/constants";
import {
  isTtsSupported,
  normalizeTextForHebrewTts,
  speakHebrew,
  speakHebrewChunks,
  stopSpeech,
} from "@/lib/tts/engine";

// A loaded Hebrew voice — speakHebrew now waits for voices before speaking (empty
// getVoices() wedges Chromium), so the synthesis tests must report a ready voice.
const HE_VOICE = {
  name: "Carmit",
  lang: "he-IL",
  localService: true,
  default: false,
  voiceURI: "Carmit",
} as unknown as SpeechSynthesisVoice;

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
    const getVoices = vi.fn(() => [HE_VOICE]);
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

  it("speakHebrew cancels and defers (via a settle delay) when synthesis is already active", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const resume = vi.fn();
    const getVoices = vi.fn(() => [HE_VOICE]);
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
    expect(speak).not.toHaveBeenCalled(); // deferred — Chrome drops speak() right after cancel()

    vi.advanceTimersByTime(130); // settle delay elapses
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it("speakHebrew passes trimmed, normalized text to SpeechSynthesisUtterance", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const resume = vi.fn();
    const getVoices = vi.fn(() => [HE_VOICE]);
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
    const getVoices = vi.fn(() => [HE_VOICE]);
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

  it("waits for voices before speaking, then speaks once voiceschanged fires", () => {
    const speak = vi.fn();
    let voices: SpeechSynthesisVoice[] = [];
    let voicesChangedCb: (() => void) | null = null;
    const addEventListener = vi.fn((ev: string, cb: () => void) => {
      if (ev === "voiceschanged") voicesChangedCb = cb;
    });
    const removeEventListener = vi.fn();

    class MockUtterance {
      text: string;
      lang = "";
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }

    // @ts-expect-error test mock
    window.speechSynthesis = {
      speak,
      cancel: vi.fn(),
      resume: vi.fn(),
      getVoices: () => voices,
      addEventListener,
      removeEventListener,
      speaking: false,
      pending: false,
    };
    // @ts-expect-error test mock
    window.SpeechSynthesisUtterance = MockUtterance as unknown as typeof SpeechSynthesisUtterance;

    speakHebrew("שלום");
    expect(speak).not.toHaveBeenCalled(); // voices empty → speaking would wedge, so deferred

    voices = [HE_VOICE];
    voicesChangedCb?.(); // voices arrive
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it("fires onEnd via the watchdog when the utterance never starts (dropped / no audio)", () => {
    const speak = vi.fn(); // never triggers onstart/onend — mimics a wedged/silent engine

    class MockUtterance {
      text: string;
      lang = "";
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }

    // @ts-expect-error test mock
    window.speechSynthesis = {
      speak,
      cancel: vi.fn(),
      resume: vi.fn(),
      getVoices: () => [HE_VOICE],
      addEventListener: vi.fn(),
      speaking: false,
      pending: false,
    };
    // @ts-expect-error test mock
    window.SpeechSynthesisUtterance = MockUtterance as unknown as typeof SpeechSynthesisUtterance;

    const onEnd = vi.fn();
    speakHebrew("שלום", onEnd);
    expect(speak).toHaveBeenCalledTimes(1);
    expect(onEnd).not.toHaveBeenCalled();

    vi.advanceTimersByTime(3000);
    expect(onEnd).toHaveBeenCalledTimes(1); // watchdog reset — button never stuck
  });
});

// Auto-play unlock — browsers block audio started without a user gesture, so
// `autoSpeakHebrew*` must defer until `unlockAudioPlayback()` runs (first gesture).
// Each test imports a FRESH engine module so the module-level unlock flag resets.
describe("tts engine — auto-play unlock", () => {
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

  let speak: ReturnType<typeof vi.fn>;

  async function freshEngine() {
    vi.resetModules();
    return import("@/lib/tts/engine");
  }

  beforeEach(() => {
    speak = vi.fn();
    // @ts-expect-error test mock
    window.speechSynthesis = {
      speak,
      cancel: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn(() => [HE_VOICE]),
      addEventListener: vi.fn(),
      speaking: false,
      pending: false,
    };
    // @ts-expect-error test mock
    window.SpeechSynthesisUtterance = MockUtterance as unknown as typeof SpeechSynthesisUtterance;
    // Silent-prime Audio is stubbed so unlock doesn't hit jsdom's unimplemented play().
    // @ts-expect-error test mock
    window.Audio = class {
      volume = 1;
      play() {
        return Promise.resolve();
      }
      pause() {}
    };
  });

  afterEach(() => {
    // @ts-expect-error cleanup
    delete window.speechSynthesis;
    // @ts-expect-error cleanup
    delete window.SpeechSynthesisUtterance;
    // @ts-expect-error cleanup
    delete window.Audio;
    vi.restoreAllMocks();
  });

  it("defers auto-play until the first gesture, then flushes it on unlock", async () => {
    const engine = await freshEngine();
    expect(engine.isAudioPlaybackUnlocked()).toBe(false);

    engine.autoSpeakHebrew("שלום");
    expect(speak).not.toHaveBeenCalled(); // deferred — no gesture yet

    engine.unlockAudioPlayback();
    expect(engine.isAudioPlaybackUnlocked()).toBe(true);
    expect(speak).toHaveBeenCalledTimes(1); // pending auto-play flushed
  });

  it("plays auto-play immediately once already unlocked", async () => {
    const engine = await freshEngine();
    engine.unlockAudioPlayback();
    speak.mockClear();

    engine.autoSpeakHebrew("שלום");
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it("keeps only the most recent deferred auto-play (last wins)", async () => {
    const engine = await freshEngine();
    engine.autoSpeakHebrew("ראשון");
    engine.autoSpeakHebrew("שני");
    engine.unlockAudioPlayback();
    expect(speak).toHaveBeenCalledTimes(1);
    expect((speak.mock.calls[0][0] as MockUtterance).text).toBe("שני");
  });

  it("unlockAudioPlayback is idempotent", async () => {
    const engine = await freshEngine();
    engine.unlockAudioPlayback();
    engine.unlockAudioPlayback();
    expect(engine.isAudioPlaybackUnlocked()).toBe(true);
  });

  it("auto-play is polite: it does NOT speak (or cancel) when speech is already active", async () => {
    const engine = await freshEngine();
    // Simulate a user-initiated utterance already playing.
    // @ts-expect-error test mock
    window.speechSynthesis.speaking = true;
    const cancel = vi.fn();
    // @ts-expect-error test mock
    window.speechSynthesis.cancel = cancel;

    engine.unlockAudioPlayback(); // already unlocked path is fine; flush happens on this call
    engine.autoSpeakHebrew("שלום"); // unlocked → runs immediately, but speech is busy

    expect(speak).not.toHaveBeenCalled(); // skipped — did not clobber the active utterance
    expect(cancel).not.toHaveBeenCalled(); // and did not cancel it
  });

  it("auto-play speaks when nothing is playing", async () => {
    const engine = await freshEngine();
    engine.unlockAudioPlayback();
    speak.mockClear();
    engine.autoSpeakHebrew("שלום"); // idle → plays
    expect(speak).toHaveBeenCalledTimes(1);
  });
});
