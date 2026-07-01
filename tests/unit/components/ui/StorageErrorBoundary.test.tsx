import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StorageErrorBoundary } from "@/components/ui/StorageErrorBoundary";
import { testIds } from "@/lib/testIds";

const t = testIds.component.ui.storageErrorBoundary;

function Boom({ message = "load failed", digest }: { message?: string; digest?: string }): never {
  const err = new Error(message) as Error & { digest?: string };
  if (digest) err.digest = digest;
  throw err;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("StorageErrorBoundary", () => {
  it("renders its children when nothing throws", () => {
    render(
      <StorageErrorBoundary>
        <p data-testid="child">ok</p>
      </StorageErrorBoundary>,
    );
    expect(screen.getByTestId("child")).toHaveTextContent("ok");
    expect(screen.queryByTestId(t.root())).toBeNull();
  });

  it("shows the Hebrew recovery UI (with the error detail) when a child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <StorageErrorBoundary>
        <Boom message="quota exceeded" />
      </StorageErrorBoundary>,
    );
    expect(screen.getByTestId(t.root())).toBeInTheDocument();
    expect(screen.getByTestId(t.title())).toHaveTextContent("שגיאה בטעינת ההתקדמות");
    expect(screen.getByTestId(t.detail())).toHaveTextContent("quota exceeded");
    expect(screen.getByTestId(t.resetCta())).toBeInTheDocument();
  });

  it("re-throws Next.js control-flow errors (notFound/redirect) instead of swallowing them", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <StorageErrorBoundary>
          <Boom digest="NEXT_NOT_FOUND" />
        </StorageErrorBoundary>,
      ),
    ).toThrow();
    // The storage recovery UI must NOT have rendered for a control-flow error.
    expect(screen.queryByTestId(t.root())).toBeNull();
  });
});
