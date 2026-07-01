import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { GmatChallengeScreen } from "@/components/screens/GmatChallengeScreen";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/lib/hooks/usePreviewAll", () => ({
  usePreviewAll: () => ({ previewAll: false, isRouteReady: true }),
}));

describe("GmatChallengeScreen", () => {
  it("mounts and renders a screen without crashing", () => {
    const { container } = render(<GmatChallengeScreen grade="a" />);
    expect(container.querySelector("main")).not.toBeNull();
  });
});
