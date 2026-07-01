import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { StudentTtsProvider, useStudentTts } from "@/components/providers/StudentTtsProvider";

afterEach(() => window.localStorage.clear());

describe("StudentTtsProvider", () => {
  it("throws when the hook is used outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useStudentTts())).toThrow(/StudentTtsProvider/);
    spy.mockRestore();
  });

  it("hydrates with auto-play off and persists a toggle", () => {
    const { result } = renderHook(() => useStudentTts(), { wrapper: StudentTtsProvider });
    expect(result.current.hydrated).toBe(true);
    expect(result.current.autoPlay).toBe(false);
    act(() => result.current.setAutoPlay(true));
    expect(result.current.autoPlay).toBe(true);
  });
});
