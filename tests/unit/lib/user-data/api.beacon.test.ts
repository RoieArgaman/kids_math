import { afterEach, describe, expect, it, vi } from "vitest";
import { beaconUserProgress } from "@/lib/user-data/api";
import { buildBundleFromLocalStorage } from "@/lib/user-data/api";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("beaconUserProgress", () => {
  it("sends via navigator.sendBeacon with an application/json Blob", () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    // jsdom's navigator may lack sendBeacon — define it explicitly.
    Object.defineProperty(globalThis.navigator, "sendBeacon", {
      configurable: true,
      writable: true,
      value: sendBeacon,
    });

    const bundle = buildBundleFromLocalStorage();
    const enqueued = beaconUserProgress(bundle);

    expect(enqueued).toBe(true);
    expect(sendBeacon).toHaveBeenCalledTimes(1);

    const [url, blob] = sendBeacon.mock.calls[0] as [string, Blob];
    expect(url).toBe("/api/user/progress");
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/json");
    expect(blob.size).toBeGreaterThan(0);

    // cleanup
    delete (globalThis.navigator as unknown as { sendBeacon?: unknown }).sendBeacon;
  });

  it("falls back to keepalive fetch when sendBeacon is unavailable", () => {
    // Ensure sendBeacon is absent.
    delete (globalThis.navigator as unknown as { sendBeacon?: unknown }).sendBeacon;
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    const bundle = buildBundleFromLocalStorage();
    const enqueued = beaconUserProgress(bundle);

    expect(enqueued).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/user/progress");
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
  });
});
