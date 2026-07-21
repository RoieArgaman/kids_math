import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// A blanket "no duplicate data-testid" guard was tried here (roadmap D15) and
// removed: many ids repeat BY DESIGN for group queries (numberline points,
// confetti pieces, badge cards) and are read with getAllByTestId, so the guard
// produced ~180 false failures and could not distinguish an intentional repeat
// from an accidental collision. The real collision that motivated it (a Field
// wrapper and its input sharing one id) is caught by getByTestId throwing in the
// test that asserts on it — which is where it should be caught.

afterEach(() => {
  // Unmount anything rendered via @testing-library/react so component tests
  // don't leak DOM between cases.
  cleanup();
  try {
    window.localStorage.clear();
  } catch {
    // ignore
  }
});
