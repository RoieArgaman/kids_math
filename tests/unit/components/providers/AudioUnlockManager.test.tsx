import { afterEach, describe, expect, it, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { AudioUnlockManager } from "@/components/providers/AudioUnlockManager";
import { unlockAudioPlayback } from "@/lib/tts/engine";

vi.mock("@/lib/tts/engine", () => ({
  unlockAudioPlayback: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AudioUnlockManager", () => {
  it("renders nothing", () => {
    const { container } = render(<AudioUnlockManager />);
    expect(container).toBeEmptyDOMElement();
  });

  it("unlocks audio on the first pointer gesture, once", () => {
    render(<AudioUnlockManager />);
    expect(unlockAudioPlayback).not.toHaveBeenCalled();

    window.dispatchEvent(new Event("pointerdown"));
    expect(unlockAudioPlayback).toHaveBeenCalledTimes(1);

    // Listener detaches after the first gesture — further gestures don't re-fire.
    window.dispatchEvent(new Event("pointerdown"));
    window.dispatchEvent(new Event("keydown"));
    expect(unlockAudioPlayback).toHaveBeenCalledTimes(1);
  });

  it("also unlocks on a keyboard gesture", () => {
    render(<AudioUnlockManager />);
    window.dispatchEvent(new Event("keydown"));
    expect(unlockAudioPlayback).toHaveBeenCalledTimes(1);
  });
});
