const PREVIEW_ALL_PARAM = "previewAll";
const PREVIEW_ALL_VALUE = "1";

function isDevEnvironment(): boolean {
  return process.env.NODE_ENV !== "production";
}

function isLocalhost(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

export function isPreviewAllEnabled(value: string | null): boolean {
  if (!isDevEnvironment() && !isLocalhost()) {
    return false;
  }
  return value === PREVIEW_ALL_VALUE;
}

export function getPreviewAllFromLocation(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return isPreviewAllEnabled(params.get(PREVIEW_ALL_PARAM));
}
