#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: ./deploy.sh --project <firebaseProjectId> [--backend <backendId>] [--skip-tests] [--skip-build]"
  echo ""
  echo "Examples:"
  echo "  ./deploy.sh --project my-firebase-project"
  echo "  ./deploy.sh --project my-firebase-project --backend kids-math"
  echo "  ./deploy.sh --project my-firebase-project --skip-tests   # after green CI on same commit"
  echo ""
  echo "  --skip-build  Only with --skip-tests. Skips local 'npm run build' (upload-only)."
  echo "                Use only when the same commit passed full CI and Node matches App Hosting."
  echo ""
  echo "Environment overrides (optional):"
  echo "  PLAYWRIGHT_BASE_URL / PLAYWRIGHT_WEB_SERVER_URL / PLAYWRIGHT_WEB_SERVER_COMMAND / PLAYWRIGHT_COOKIE_URL"
}

PROJECT_ID=""
BACKEND_ID="kids-math"
SKIP_TESTS="0"
SKIP_BUILD="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT_ID="${2:-}"
      shift 2
      ;;
    --backend)
      BACKEND_ID="${2:-}"
      shift 2
      ;;
    --skip-tests)
      SKIP_TESTS="1"
      shift
      ;;
    --skip-build)
      SKIP_BUILD="1"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1"
      usage
      exit 2
      ;;
  esac
done

if [[ -z "$PROJECT_ID" ]]; then
  echo "Missing required --project <firebaseProjectId>"
  usage
  exit 2
fi

if [[ "$SKIP_BUILD" == "1" && "$SKIP_TESTS" != "1" ]]; then
  echo "--skip-build requires --skip-tests (quick / upload-only path)."
  usage
  exit 2
fi

if ! command -v firebase >/dev/null 2>&1; then
  echo "Firebase CLI is not installed."
  echo "Install with: npm install -g firebase-tools"
  exit 1
fi

echo "Using Firebase project: $PROJECT_ID"
echo "Using App Hosting backend: $BACKEND_ID"

echo "Installing dependencies (npm ci)"
npm ci

# Keep Playwright browsers in a repo-local cache so installs work reliably
# across different runners/sandboxes.
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-.playwright-browsers}"

if [[ "$SKIP_TESTS" != "1" ]]; then
  echo "Running lint"
  npm run lint

  echo "Running unit tests"
  npm run test:unit

  echo "Building"
  npm run build

  echo "Installing Playwright browsers (chromium)"
  npx playwright install --with-deps chromium

  echo "Running E2E tests"
  CI=1 npm run test:e2e
else
  echo "Skipping tests (--skip-tests)"
  if [[ "$SKIP_BUILD" == "1" ]]; then
    echo ""
    echo "Skipping local build (--skip-build)."
    echo "Policy: use only when this commit already passed full CI on main (same SHA) and Node/tooling matches Firebase App Hosting."
    echo "App Hosting still runs a cloud build from uploaded source."
    echo ""
  else
    echo "Building"
    npm run build
  fi
fi

echo "Deploying to Firebase App Hosting"
echo "Note: App Hosting requires the Firebase project to be on the Blaze (pay-as-you-go) plan."
if ! firebase deploy --project "$PROJECT_ID" --only "apphosting:$BACKEND_ID"; then
  echo ""
  echo "Deploy failed. If the error mentions Blaze/billing, upgrade the plan here:"
  echo "  https://console.firebase.google.com/project/${PROJECT_ID}/usage/details"
  exit 1
fi

echo "Done."

