import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { AppProviders } from "@/components/providers/AppProviders";
import { useAdminTtsEnabled } from "@/components/providers/AdminTtsProvider";

// AuthProvider hits session APIs on mount — stub it to a passthrough so we can test
// that AppProviders wires the TTS provider around its children.
vi.mock("@/lib/auth/context", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

function Probe() {
  // The hook throws unless its provider is an ancestor — so a successful render
  // proves AppProviders mounted the admin TTS provider.
  useAdminTtsEnabled();
  return <span data-testid="probe">ready</span>;
}

afterEach(() => window.localStorage.clear());

describe("AppProviders", () => {
  it("provides the admin TTS context to its children", () => {
    render(
      <AppProviders>
        <Probe />
      </AppProviders>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("ready");
  });
});
