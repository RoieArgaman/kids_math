import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminProgressScreen } from "@/components/screens/AdminProgressScreen";
import { useAdminSession } from "@/lib/hooks/useAdminSession";
import { testIds } from "@/lib/testIds";

vi.mock("@/lib/hooks/useAdminSession", () => ({ useAdminSession: vi.fn() }));
// AdminProgressScreen reads the admin TTS preference (for a toggle) before the PIN gate,
// so the provider hook must resolve even in the locked state we're asserting here.
vi.mock("@/components/providers/AdminTtsProvider", () => ({
  useAdminTtsEnabled: () => ({ ttsEnabled: false, setTtsEnabled: vi.fn(), hydrated: true }),
}));

beforeEach(() => vi.clearAllMocks());

describe("AdminProgressScreen", () => {
  it("gates management behind a PIN when locked", () => {
    vi.mocked(useAdminSession).mockReturnValue({ isUnlocked: false, unlock: vi.fn() } as unknown as ReturnType<typeof useAdminSession>);
    render(<AdminProgressScreen />);
    expect(screen.getByTestId(testIds.screen.adminProgress.root())).toBeInTheDocument();
    expect(screen.getByTestId(testIds.screen.adminProgress.pinInput())).toBeInTheDocument();
  });
});
