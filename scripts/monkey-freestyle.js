/* Free-style monkey / fuzz tester for kids_math.
 * Drives the live dev server on :3005 with Chromium, random-walks the app with
 * adversarial inputs, fuzzes URLs, and records any console errors, page errors,
 * 5xx responses, crashes, blank pages, or broken gates.
 */
const { chromium } = require("@playwright/test");

const BASE = process.env.BASE || "http://127.0.0.1:3005";
const SEED = Number(process.env.SEED || 1337);
const STEPS = Number(process.env.STEPS || 80);

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const ADVERSARIAL = ["", "0", "-5", "999999999999", "3.5", "1e9", "abc", "   ", "00012", "+-", "🙂", "-0", "100000000000000000000"];
const ROUTES = [
  "/", "/math", "/grade/a", "/grade/a/plan", "/grade/a/badges",
  "/grade/a/gmat-challenge", "/english", "/english/a", "/grade/b/locked",
  "/privacy", "/cookies", "/admin/progress", "/admin/users",
];
// URL fuzz: malformed / out-of-range params that should be handled gracefully (no 500).
const URL_FUZZ = [
  "/grade/z", "/grade/a/day/day-999", "/grade/a/day/not-a-day",
  "/grade/a/day/day-1/section/bogus-section", "/grade/a/day/day-1/section/",
  "/english/z", "/english/a/day/day-999", "/grade/b", "/grade/b/day/day-1",
  "/grade/A", "/admin", "/grade/a/day/-1", "/grade/a/gmat-challenge/x",
  "/%00", "/grade/a/../../etc", "/day/day-1",
];

const findings = [];
const seenKeys = new Set();
function record(sev, area, msg, detail) {
  const key = `${area}::${msg}`.slice(0, 200);
  if (seenKeys.has(key)) return;
  seenKeys.add(key);
  findings.push({ sev, area, msg, detail });
  console.log(`[${sev}] ${area}: ${msg}${detail ? " — " + detail : ""}`);
}

function attachListeners(page, ctxLabelRef) {
  page.on("console", (m) => {
    if (m.type() === "error") {
      const t = m.text();
      if (/favicon|Download the React DevTools|Lighthouse/i.test(t)) return;
      record("MEDIUM", ctxLabelRef.url, `console.error: ${t.slice(0, 180)}`);
    }
  });
  page.on("pageerror", (e) => record("HIGH", ctxLabelRef.url, `pageerror: ${String(e.message).slice(0, 200)}`));
  page.on("response", (res) => {
    const s = res.status();
    if (s >= 500) record("HIGH", ctxLabelRef.url, `HTTP ${s} ${res.url().replace(BASE, "")}`);
  });
  page.on("requestfailed", (req) => {
    const f = req.failure();
    if (f && !/ERR_ABORTED/.test(f.errorText)) record("LOW", ctxLabelRef.url, `requestfailed ${req.url().replace(BASE, "")} (${f.errorText})`);
  });
}

async function checkHealth(page, ref) {
  // Next.js dev error overlay / blank page detection.
  try {
    const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
    if (dir !== "rtl") record("MEDIUM", ref.url, `html dir is "${dir}" (expected rtl)`);
  } catch {}
  try {
    const txt = (await page.evaluate(() => document.body?.innerText || "")).trim();
    if (txt.length < 2) record("HIGH", ref.url, "blank page (body has no text)");
    if (/Application error|Unhandled Runtime Error|This page could not be found|500|Internal Server Error/i.test(txt) &&
        !ref.url.includes("/locked")) {
      // some of these may be legit 404s for fuzz urls; only flag 500-ish
      if (/Application error|Unhandled Runtime Error|Internal Server Error/i.test(txt))
        record("HIGH", ref.url, `error text on page: ${txt.slice(0, 120)}`);
    }
  } catch (e) {
    record("HIGH", ref.url, `evaluate crashed: ${String(e).slice(0, 120)}`);
  }
}

async function go(page, ref, path) {
  ref.url = path;
  let resp;
  try {
    resp = await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 15000 });
  } catch (e) {
    record("HIGH", path, `navigation failed: ${String(e.message).slice(0, 120)}`);
    return;
  }
  if (resp) ref.status = resp.status();
  await page.waitForTimeout(250);
  await checkHealth(page, ref);
}

async function randomActions(page, ref) {
  // Fill number inputs adversarially
  const inputs = await page.locator('input[type="number"], input[inputmode="numeric"], input[type="text"]').all().catch(() => []);
  for (const inp of inputs.slice(0, 4)) {
    if (rnd() < 0.7) {
      try { await inp.fill(pick(ADVERSARIAL), { timeout: 1000 }); } catch {}
    }
  }
  // Click a random visible enabled button
  const btns = await page.locator('button:visible, [role="button"]:visible, a:visible').all().catch(() => []);
  if (btns.length) {
    const b = pick(btns);
    try {
      await b.click({ timeout: 1500, trial: false });
      if (rnd() < 0.2) await b.click({ timeout: 800 }).catch(() => {}); // double-click
    } catch {}
  }
  // Random keyboard
  if (rnd() < 0.3) await page.keyboard.press(pick(["Enter", "Escape", "Tab"])).catch(() => {});
  // Occasionally corrupt localStorage and reload
  if (rnd() < 0.12) {
    try {
      await page.evaluate(() => {
        const keys = ["kids_math.workbook_progress.v1.grade.a", "kids_math.streak.v1", "kids_math.tts_prefs.v1", "kids_math.badges.v1.grade.a"];
        for (const k of keys) localStorage.setItem(k, "{not valid json" + Math.random());
      });
      await page.reload({ waitUntil: "domcontentloaded", timeout: 12000 });
      await page.waitForTimeout(200);
      const hasBoundary = await page.locator('[data-testid="km.component.ui.storageErrorBoundary"]').count().catch(() => 0);
      await checkHealth(page, { ...ref, url: ref.url + " [corrupt-storage]" });
      if (hasBoundary) record("INFO", ref.url, "StorageErrorBoundary shown after corrupt storage (graceful)");
    } catch (e) {
      record("HIGH", ref.url, `corrupt-storage reload crashed: ${String(e).slice(0, 120)}`);
    }
  }
  // Random back/forward
  if (rnd() < 0.2) await page.goBack({ timeout: 5000 }).catch(() => {});
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const ref = { url: "/", status: 0 };
  attachListeners(page, ref);

  console.log(`MONKEY seed=${SEED} steps=${STEPS} base=${BASE}`);

  // Phase 1: URL fuzz — must not 500 / crash
  console.log("\n--- Phase 1: URL fuzz ---");
  for (const u of URL_FUZZ) {
    await go(page, ref, u);
  }

  // Phase 2: targeted flow checks
  console.log("\n--- Phase 2: targeted flows ---");
  // 2a: grade-b gate redirect
  await ctx.clearCookies();
  await go(page, ref, "/grade/b/day/day-1");
  if (!page.url().includes("/grade/b/locked")) record("HIGH", "/grade/b/day/day-1", `gate did NOT redirect to locked (url=${page.url().replace(BASE, "")})`);
  // 2b: admin wrong PIN
  await go(page, ref, "/admin/progress");
  try {
    const pin = page.locator('[data-testid="km.screen.adminProgress.pin.input"]');
    if (await pin.count()) {
      await pin.fill("000000");
      await page.locator('[data-testid="km.screen.adminProgress.pin.submit"]').click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(400);
      const err = await page.locator('[data-testid="km.screen.adminProgress.pin.error"]').count();
      if (!err) record("MEDIUM", "/admin/progress", "wrong PIN produced no visible error message");
    }
  } catch {}

  // Phase 3: random walk
  console.log("\n--- Phase 3: random walk ---");
  for (let i = 0; i < STEPS; i++) {
    if (rnd() < 0.5 || true) {
      // bias toward random route then act
      if (rnd() < 0.6) await go(page, ref, pick(ROUTES));
    }
    await randomActions(page, ref);
  }

  await browser.close();

  // Summary
  const bySev = findings.reduce((m, f) => ((m[f.sev] = (m[f.sev] || 0) + 1), m), {});
  console.log("\n===== MONKEY SUMMARY =====");
  console.log("seed:", SEED, "counts:", JSON.stringify(bySev));
  console.log(JSON.stringify(findings, null, 2));
})().catch((e) => { console.error("MONKEY FATAL", e); process.exit(1); });
