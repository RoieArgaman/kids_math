import { afterEach } from "vitest";

afterEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    // ignore
  }
});
