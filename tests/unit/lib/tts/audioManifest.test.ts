import { describe, expect, it } from "vitest";
import { audioManifestKey, lookupAudioUrl } from "@/lib/tts/audioManifest";

describe("audioManifestKey", () => {
  it("is deterministic and namespaced by language", () => {
    expect(audioManifestKey("hello", "en")).toBe(audioManifestKey("hello", "en"));
    expect(audioManifestKey("hello", "en")).not.toBe(audioManifestKey("hello", "he"));
  });

  it("differs for different text", () => {
    expect(audioManifestKey("red", "en")).not.toBe(audioManifestKey("blue", "en"));
  });
});

describe("lookupAudioUrl", () => {
  it("returns null when the manifest is empty (default ship state → fallback)", () => {
    expect(lookupAudioUrl("hello", "en", {})).toBeNull();
  });

  it("returns the URL on a hit", () => {
    const key = audioManifestKey("hello", "en");
    expect(lookupAudioUrl("hello", "en", { [key]: "/audio/hello.mp3" })).toBe("/audio/hello.mp3");
  });

  // INV-FALLBACK fault injection: malformed / corrupt entries never throw → treated as misses.
  it("treats non-string and empty entries as misses", () => {
    const key = audioManifestKey("hello", "en");
    expect(lookupAudioUrl("hello", "en", { [key]: 42 } as Record<string, unknown>)).toBeNull();
    expect(lookupAudioUrl("hello", "en", { [key]: "" })).toBeNull();
    expect(lookupAudioUrl("hello", "en", { [key]: null } as Record<string, unknown>)).toBeNull();
  });

  it("never throws on a hostile manifest source", () => {
    const hostile = new Proxy(
      {},
      {
        get() {
          throw new Error("boom");
        },
      },
    ) as Record<string, unknown>;
    expect(lookupAudioUrl("hello", "en", hostile)).toBeNull();
  });

  it("uses the default (empty) manifest when no source is passed", () => {
    expect(lookupAudioUrl("anything", "he")).toBeNull();
  });
});
