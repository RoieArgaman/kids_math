import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StudentTtsToggle } from "@/components/ui/StudentTtsToggle";
import { useAdminTtsEnabled } from "@/lib/hooks/useAdminTtsEnabled";
import { useStudentTts } from "@/components/providers/StudentTtsProvider";
import { testIds } from "@/lib/testIds";

vi.mock("@/lib/hooks/useAdminTtsEnabled", () => ({ useAdminTtsEnabled: vi.fn() }));
vi.mock("@/components/providers/StudentTtsProvider", () => ({ useStudentTts: vi.fn() }));

const ROOT = testIds.component.topBar.studentTtsToggle();

function setup({
  ttsEnabled = true,
  adminHydrated = true,
  studentHydrated = true,
  autoPlay = false,
  setAutoPlay = vi.fn(),
}: {
  ttsEnabled?: boolean;
  adminHydrated?: boolean;
  studentHydrated?: boolean;
  autoPlay?: boolean;
  setAutoPlay?: () => void;
} = {}) {
  vi.mocked(useAdminTtsEnabled).mockReturnValue({ ttsEnabled, hydrated: adminHydrated } as ReturnType<typeof useAdminTtsEnabled>);
  vi.mocked(useStudentTts).mockReturnValue({ autoPlay, setAutoPlay, hydrated: studentHydrated } as ReturnType<typeof useStudentTts>);
  return { setAutoPlay };
}

beforeEach(() => vi.clearAllMocks());

describe("StudentTtsToggle", () => {
  it("renders nothing until both admin + student prefs have hydrated", () => {
    setup({ adminHydrated: false });
    render(<StudentTtsToggle />);
    expect(screen.queryByTestId(ROOT)).toBeNull();
  });

  it("renders nothing when the admin TTS pref is disabled", () => {
    setup({ ttsEnabled: false });
    render(<StudentTtsToggle />);
    expect(screen.queryByTestId(ROOT)).toBeNull();
  });

  it("shows the OFF state when auto-play is disabled", () => {
    setup({ autoPlay: false });
    render(<StudentTtsToggle />);
    const btn = screen.getByTestId(ROOT);
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(btn).toHaveTextContent("קוֹל כָּבוּי");
  });

  it("shows the ON state (with pulse) when auto-play is enabled", () => {
    setup({ autoPlay: true });
    render(<StudentTtsToggle />);
    const btn = screen.getByTestId(ROOT);
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn).toHaveTextContent("קוֹל פָּעִיל");
  });

  it("toggles the pref on click", async () => {
    const { setAutoPlay } = setup({ autoPlay: false });
    render(<StudentTtsToggle />);
    await userEvent.click(screen.getByTestId(ROOT));
    expect(setAutoPlay).toHaveBeenCalledWith(true);
  });
});
