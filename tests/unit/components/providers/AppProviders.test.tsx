import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { AppProviders } from "@/components/providers/AppProviders";
import { useAdminTtsEnabled } from "@/components/providers/AdminTtsProvider";
import { useStudentTts } from "@/components/providers/StudentTtsProvider";

// AuthProvider hits session APIs on mount — stub it to a passthrough so we can test
// that AppProviders wires the TTS providers around its children.
vi.mock("@/lib/auth/context", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

function Probe() {
  // Both hooks throw unless their provider is an ancestor — so a successful render
  // proves AppProviders mounted both.
  useAdminTtsEnabled();
  useStudentTts();
  return <span data-testid="probe">ready</span>;
}

afterEach(() => window.localStorage.clear());

describe("AppProviders", () => {
  it("provides the admin + student TTS contexts to its children", () => {
    render(
      <AppProviders>
        <Probe />
      </AppProviders>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("ready");
  });
});
