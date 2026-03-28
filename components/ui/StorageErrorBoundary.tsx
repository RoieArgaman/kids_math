"use client";

import { Component, type ReactNode } from "react";

import { testIds } from "@/lib/testIds";

interface Props {
  children: ReactNode;
  /** Optional storage key to clear on reset (clears all kids_math keys if omitted). */
  storageKey?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Catches errors during progress-state hydration and renders a Hebrew recovery
 * message with a reset button rather than crashing the whole page.
 *
 * Usage: wrap grade page layouts in <StorageErrorBoundary>.
 */
export class StorageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidMount() {
    window.addEventListener("kids_math:storage_quota_exceeded", this.handleQuotaEvent);
  }

  componentWillUnmount() {
    window.removeEventListener("kids_math:storage_quota_exceeded", this.handleQuotaEvent);
  }

  private handleQuotaEvent = () => {
    this.setState({
      hasError: true,
      errorMessage: "אחסון המכשיר מלא — לא ניתן לשמור התקדמות.",
    });
  };

  private handleReset() {
    try {
      if (this.props.storageKey) {
        localStorage.removeItem(this.props.storageKey);
      } else {
        // Clear all kids_math keys
        const toRemove = Object.keys(localStorage).filter((k) =>
          k.startsWith("kids_math.workbook_progress"),
        );
        toRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch {
      // ignore
    }
    window.location.reload();
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const t = testIds.component.ui.storageErrorBoundary;
    return (
      <div
        data-testid={t.root()}
        className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center"
      >
        <p data-testid={t.title()} className="text-2xl font-bold text-red-600">שגיאה בטעינת ההתקדמות</p>
        <p data-testid={t.body()} className="text-gray-700">
          לא הצלחנו לטעון את ההתקדמות שלך.
          <br data-testid={t.br()} />
          {this.state.errorMessage && (
            <span data-testid={t.detail()} className="text-sm text-gray-500">{this.state.errorMessage}</span>
          )}
        </p>
        <button
          data-testid={t.resetCta()}
          onClick={this.handleReset}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          התחל מחדש
        </button>
      </div>
    );
  }
}
