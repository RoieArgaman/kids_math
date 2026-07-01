import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminHubScreen } from "@/components/screens/AdminHubScreen";
import { useAdminSession } from "@/lib/hooks/useAdminSession";
import { testIds } from "@/lib/testIds";

vi.mock("@/lib/hooks/useAdminSession", () => ({ useAdminSession: vi.fn() }));

const root = testIds.screen.adminHub.root();

function mockSession(isUnlocked: boolean, unlock = vi.fn(() => true)) {
  vi.mocked(useAdminSession).mockReturnValue({ isUnlocked, unlock, exit: vi.fn() } as unknown as ReturnType<typeof useAdminSession>);
  return unlock;
}

beforeEach(() => vi.clearAllMocks());

describe("AdminHubScreen", () => {
  it("shows the PIN gate when locked", () => {
    mockSession(false);
    render(<AdminHubScreen />);
    expect(screen.getByTestId(root)).toBeInTheDocument();
    expect(screen.getByTestId(testIds.screen.adminHub.pinInput())).toBeInTheDocument();
  });

  it("shows a PIN error when the entered code is wrong", async () => {
    mockSession(false, vi.fn(() => false));
    render(<AdminHubScreen />);
    await userEvent.type(screen.getByTestId(testIds.screen.adminHub.pinInput()), "0000");
    await userEvent.click(screen.getByTestId(testIds.screen.adminHub.pinSubmit()));
    expect(screen.getByTestId(testIds.screen.adminHub.pinError())).toBeInTheDocument();
  });

  it("shows the hub cards once unlocked", () => {
    mockSession(true);
    render(<AdminHubScreen />);
    expect(screen.getByTestId(testIds.screen.adminHub.progressCard())).toBeInTheDocument();
    expect(screen.getByTestId(testIds.screen.adminHub.parentDashboardCard())).toBeInTheDocument();
  });
});
