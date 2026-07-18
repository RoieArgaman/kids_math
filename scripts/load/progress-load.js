/* eslint-disable */
// @ts-nocheck
/**
 * k6 load test — kids_math classroom concurrency (roadmap Phase 2.4 / finding C7).
 *
 * Simulates the two workloads that stress the app at class-start:
 *   1. `login_burst`     — a room of students logging in together (auth + bcrypt + Firestore).
 *   2. `progress_push`   — steady per-student progress POSTs (the merge transaction on the
 *                          single `user_progress/{userId}` doc — watch this to surface the
 *                          C5 single-doc contention as VUs climb).
 *
 * This is a `.js` k6 script (run by the k6 binary, NOT node/vitest/tsc). It is intentionally
 * outside the TypeScript/ESLint/build scope. See ./README.md to run it and record the baseline
 * into roadmap Appendix C.
 *
 * Config via env vars (all optional; defaults target a local server):
 *   BASE_URL   base URL of the target            (default http://localhost:3005)
 *   USERS      JSON array of {username,password} (default: single user from USERNAME/PASSWORD)
 *   USERNAME   single-user fallback username     (default "loadtest")
 *   PASSWORD   single-user fallback password     (default "loadtest123")
 *   BURST_RATE logins per second for the burst   (default 4  → ~40 / 10s)
 *   PUSH_VUS   steady progress-push VUs          (default 30 → ~one classroom)
 *   DURATION   steady-phase duration             (default "2m")
 *
 * NEVER point this at production. Use a scratch/staging backend with disposable test users.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";
import { SharedArray } from "k6/data";

const BASE_URL = (__ENV.BASE_URL || "http://localhost:3005").replace(/\/$/, "");
const BURST_RATE = Number(__ENV.BURST_RATE || 4);
const PUSH_VUS = Number(__ENV.PUSH_VUS || 30);
const DURATION = __ENV.DURATION || "2m";

// Credentials: prefer a USERS json array (realistic — a room of distinct accounts); otherwise
// fall back to a single account. Admin-created (see `npm run create-user`); this test never
// creates accounts.
const users = new SharedArray("users", () => {
  if (__ENV.USERS) return JSON.parse(__ENV.USERS);
  return [{ username: __ENV.USERNAME || "loadtest", password: __ENV.PASSWORD || "loadtest123" }];
});

// Split latency by workload so the report shows login cost vs. push cost independently.
const loginLatency = new Trend("login_latency", true);
const pushLatency = new Trend("progress_push_latency", true);
const loginFailRate = new Rate("login_failed");
const pushFailRate = new Rate("progress_push_failed");

export const options = {
  // k6 clears each VU's cookie jar between iterations by default. progressPush logs in once
  // (__ITER === 0) and relies on the session cookie for later iterations — without this, every
  // iteration after the first pushes with no session and gets a 401 (which also skewed push
  // latency low, since 401s return fast). Keeping cookies also models a real student: log in
  // once, then push progress repeatedly.
  noCookiesReset: true,
  scenarios: {
    login_burst: {
      executor: "constant-arrival-rate",
      exec: "loginBurst",
      rate: BURST_RATE,
      timeUnit: "1s",
      duration: "30s",
      preAllocatedVUs: Math.max(10, BURST_RATE * 4),
      maxVUs: Math.max(20, BURST_RATE * 10),
    },
    progress_push: {
      executor: "constant-vus",
      exec: "progressPush",
      vus: PUSH_VUS,
      duration: DURATION,
      startTime: "30s", // let the burst clear first
    },
  },
  // Threshold the CUSTOM per-workload metrics rather than scenario-tagged http_req_duration:
  // the progress_push scenario also performs the iter-0 login, so its request duration conflates
  // login cost into the push numbers (reads ~3.3s even when pushes are ~2.2s).
  // Values carry headroom over the measured europe-west4 baseline at minInstances=3
  // (login p95 ~3.1s, push p95 ~2.2s) so normal variance doesn't produce false alarms.
  thresholds: {
    login_latency: ["p(95)<4500"],
    progress_push_latency: ["p(95)<3000"],
    login_failed: ["rate<0.01"],
    progress_push_failed: ["rate<0.01"],
  },
};

function pickUser() {
  return users[Math.floor(Math.random() * users.length)];
}

/** POST /api/auth/login; returns true on 200. Cookies land in this VU's jar automatically. */
function doLogin(user) {
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(user), {
    headers: { "Content-Type": "application/json" },
    tags: { name: "login" },
  });
  loginLatency.add(res.timings.duration);
  const ok = res.status === 200;
  loginFailRate.add(!ok);
  return ok;
}

export function loginBurst() {
  const ok = doLogin(pickUser());
  check(ok, { "login succeeded": (v) => v === true });
}

export function progressPush() {
  // Log in once per VU (first iteration), then reuse the session cookie for subsequent pushes.
  if (__ITER === 0) {
    if (!doLogin(pickUser())) {
      sleep(1);
      return;
    }
  }
  // A full, valid bundle shape so the server-side mergeBundles path actually runs (a bare
  // `{bundleVersion}` envelope passes validation but 500s in the merge — and those 500s would
  // trip the error-spike alert). This mirrors UserProgressBundle's per-grade domains.
  const emptyGrade = { workbook: null, badges: null, finalExam: null, gmat: null, review: null };
  const body = JSON.stringify({
    bundleVersion: 4,
    updatedAt: new Date().toISOString(),
    streak: null,
    grades: { a: emptyGrade, b: emptyGrade },
  });
  const res = http.post(`${BASE_URL}/api/user/progress`, body, {
    headers: { "Content-Type": "application/json" },
    tags: { name: "progress_push" },
  });
  pushLatency.add(res.timings.duration);
  const ok = res.status === 200;
  pushFailRate.add(!ok);
  check(ok, { "progress push accepted": (v) => v === true });

  // ~one push per 30s per student (matches the debounced scheduleSync cadence).
  sleep(30);
}
