import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { FinalExamScreen } from "@/components/screens/FinalExamScreen";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/lib/hooks/useDayUnlockStatus", () => ({
  useDayUnlockStatus: () => ({ previewAll: false, isRouteReady: true, isLocked: true }),
}));

describe("FinalExamScreen", () => {
  it("mounts and renders a screen without crashing when the exam is locked", () => {
    const { container } = render(<FinalExamScreen grade="a" />);
    expect(container.querySelector("main")).not.toBeNull();
  });
});
