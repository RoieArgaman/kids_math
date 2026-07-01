import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

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
