import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const tid = { root: "dlg", confirm: "dlg.confirm", cancel: "dlg.cancel", title: "dlg.title" };

function setup(props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      open
      title="למחוק את המשתמש?"
      confirmLabel="מחק"
      onConfirm={onConfirm}
      onCancel={onCancel}
      testIds={tid}
      {...props}
    >
      <p>dana</p>
    </ConfirmDialog>,
  );
  return { onConfirm, onCancel };
}

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    setup({ open: false });
    expect(screen.queryByTestId("dlg")).not.toBeInTheDocument();
  });

  it("exposes an accessible modal dialog", () => {
    setup();
    const panel = screen.getByRole("alertdialog");
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(panel).toHaveAttribute("dir", "rtl");
    expect(panel).toHaveAccessibleName("למחוק את המשתמש?");
  });

  it("fires the callbacks on confirm and cancel", async () => {
    const { onConfirm, onCancel } = setup();
    await userEvent.click(screen.getByTestId("dlg.confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByTestId("dlg.cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("cancels on Escape", async () => {
    const { onCancel, onConfirm } = setup();
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("cancels on a backdrop click but not on a click inside the panel", async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByRole("alertdialog"));
    expect(onCancel).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("dlg"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  // A destructive dialog appears under the pointer that just clicked Delete; focusing Confirm
  // would let a double-tap or stray Enter destroy data.
  it("autofocuses Cancel when destructive, Confirm otherwise", () => {
    const { unmount } = render(
      <ConfirmDialog
        open
        destructive
        title="t"
        confirmLabel="c"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        testIds={tid}
      >
        x
      </ConfirmDialog>,
    );
    expect(screen.getByTestId("dlg.cancel")).toHaveFocus();
    unmount();

    setup({ destructive: false });
    expect(screen.getByTestId("dlg.confirm")).toHaveFocus();
  });

  it("traps Tab inside the dialog", async () => {
    setup({ destructive: true });
    expect(screen.getByTestId("dlg.cancel")).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByTestId("dlg.confirm")).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByTestId("dlg.cancel")).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(screen.getByTestId("dlg.confirm")).toHaveFocus();
  });

  it("disables both actions while busy", () => {
    setup({ busy: true });
    expect(screen.getByTestId("dlg.confirm")).toBeDisabled();
    expect(screen.getByTestId("dlg.cancel")).toBeDisabled();
  });
});
