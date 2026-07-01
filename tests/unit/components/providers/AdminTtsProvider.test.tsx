import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { AdminTtsProvider, useAdminTtsEnabled } from "@/components/providers/AdminTtsProvider";

afterEach(() => window.localStorage.clear());

describe("AdminTtsProvider", () => {
  it("throws when the hook is used outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAdminTtsEnabled())).toThrow(/AdminTtsProvider/);
    spy.mockRestore();
  });

  it("hydrates (default TTS on) and persists a toggle", () => {
    const { result } = renderHook(() => useAdminTtsEnabled(), { wrapper: AdminTtsProvider });
    expect(result.current.hydrated).toBe(true);
    expect(result.current.ttsEnabled).toBe(true);
    act(() => result.current.setTtsEnabled(false));
    expect(result.current.ttsEnabled).toBe(false);
  });
});
