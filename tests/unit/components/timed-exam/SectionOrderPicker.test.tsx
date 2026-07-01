import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SectionOrderPicker } from "@/components/timed-exam/SectionOrderPicker";
import type { GmatSectionKey } from "@/lib/gmat-challenge/types";
import { childTid } from "@/lib/testIds";

const ROOT = "km.test.order";
const order = ["s1", "s2", "s3"] as unknown as GmatSectionKey[];
const labels = { s1: "מקטע 1", s2: "מקטע 2", s3: "מקטע 3" } as unknown as Record<GmatSectionKey, string>;

function renderPicker(props: Partial<Parameters<typeof SectionOrderPicker>[0]> = {}) {
  const onChangeOrder = vi.fn();
  const onConfirm = vi.fn();
  render(
    <SectionOrderPicker rootTestId={ROOT} order={order} labels={labels} onChangeOrder={onChangeOrder} onConfirm={onConfirm} {...props} />,
  );
  return { onChangeOrder, onConfirm };
}

describe("SectionOrderPicker", () => {
  it("lists each section in the given order and disables 'up' on the first row", () => {
    renderPicker();
    expect(screen.getByTestId(childTid(ROOT, "row", 0, "label"))).toHaveTextContent("1. מקטע 1");
    expect(screen.getByTestId(childTid(ROOT, "row", 0, "up"))).toBeDisabled();
    expect(screen.getByTestId(childTid(ROOT, "row", 2, "down"))).toBeDisabled();
  });

  it("moves a row up and reports the reordered list", async () => {
    const { onChangeOrder } = renderPicker();
    await userEvent.click(screen.getByTestId(childTid(ROOT, "row", 1, "up")));
    expect(onChangeOrder).toHaveBeenCalledWith(["s2", "s1", "s3"]);
  });

  it("confirms the chosen order", async () => {
    const { onConfirm } = renderPicker();
    await userEvent.click(screen.getByTestId(childTid(ROOT, "cta", "confirm")));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
