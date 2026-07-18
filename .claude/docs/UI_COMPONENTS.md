# UI Components & Shared Library (kids_math)

Catalog of the shared component / hook / util library created by the DRY refactor.
**Reuse these before hand-rolling card/button/input/banner markup.** Run
`npm run check:cards` for advisory guidance on un-migrated markup.

All components live under `components/ui/*`; hooks under `lib/hooks/*`; utils under
`lib/utils/*`. Everything forwards `data-testid` and derives child ids via
`childTid()` from `lib/testIds.ts`. RTL is the default; `dir="ltr"` only for
numerals / math.

---

## Canonical card tokens

These are the canonical values the card system encodes. Match them when building
new cards by hand (or just use `<Card>` / `<ActionCard>`, which apply them):

| Token | Value | Notes |
|-------|-------|-------|
| Card radius | `20px` | The `surface` class radius. |
| Padding `sm` | `p-4` | |
| Padding `md` | `p-5` | **Default** for `Card` / `ActionCard`. |
| Padding `lg` | `p-6` | |
| Card body rhythm | `space-y-2` | Vertical spacing between stacked body items. |
| ActionCard CTA gap | `mt-5` | Gap between the heading block and the CTA. |
| CTA sizing | full-width, `min-h-[44px]` | `inline-flex w-full justify-center text-center`; ≥44px touch target via `touch-button`. |

---

## Cards

### `Card` — `components/ui/Card.tsx`
Canonical card. Composes `Surface` (padding applied on the outer surface, where it
works) and wraps children in a body `<div>` it controls, so layout classes are not
swallowed by Surface.

Props: `children`, `padding?: "sm" | "md" | "lg"` (default `md`), `variant?:
SurfaceVariant`, `className?`, `bodyClassName?` (e.g. `"space-y-2"` for rhythm — this
is the wrapper Card owns), `data-testid?`.

```tsx
import { Card } from "@/components/ui/Card";

<Card data-testid={testIds.foo.card(id)} bodyClassName="space-y-2">
  <h2 className="text-xl font-bold text-[#2c2348]">כותרת</h2>
  <p className="text-sm text-[#8a8298]">תיאור קצר</p>
</Card>
```

### `ActionCard` — `components/ui/Card.tsx`
Card with an emoji/title/subtitle heading block and a full-width CTA. Reproduces the
canonical AdminHub action-card markup exactly.

Props: `title` (required), `cta: { href, label, "data-testid"? }` (required),
`emoji?`, `subtitle?`, `padding?` (default `md`), `variant?`, `data-testid?`, plus
optional child testids for zero-diff adoption: `bodyTestId?`, `emojiTestId?`,
`titleTestId?`, `subtitleTestId?`.

```tsx
import { ActionCard } from "@/components/ui/Card";

<ActionCard
  data-testid={testIds.hub.usersCard()}
  emoji="👤"
  title="ניהול משתמשים"
  subtitle="הוספה ומחיקה של חשבונות"
  cta={{ href: routes.adminUsers(), label: "פתח", "data-testid": testIds.hub.usersCta() }}
/>
```

### `Tile` — `components/ui/Tile.tsx`
Small labelled stat / counter tile for dashboard grids. `tone="default"` is the
bordered StatTile; `neutral|success|warning` are filled CounterTiles.

Props: `label` (required), `value?: ReactNode` **or** `children` (children wins),
`tone?: "default" | "neutral" | "success" | "warning"` (default `default`),
`data-testid?`. Renders `childTid(testId, "value")` and `childTid(testId, "label")`.

```tsx
import { Tile } from "@/components/ui/Tile";

<Tile data-testid={testIds.dash.streakTile()} label="רצף ימים" tone="success">
  <Ltr>7</Ltr>
</Tile>
```

### `Surface` — `components/ui/Surface.tsx` (pre-existing)
The base rounded panel. `variant?: "default" | "success" | "error"`, `className?`,
`data-testid?`. **Note the gotcha below** — prefer `Card` when you need body layout.

### `CenteredPanel` — `components/ui/CenteredPanel.tsx` (pre-existing)
Full-screen centered card (emoji/title/description/actions) for empty/locked states.
Props: `title` (required), `emoji?`, `description?`, `actions?`, `surfaceVariant?`,
`className?`, `data-testid?`.

### `LoadingPanel` — `components/ui/LoadingPanel.tsx` (pre-existing)
Centered loading card. Props: `title` (required), `emoji?`, `className?`.

---

## Layout / Nav

### `HeroHeader` — `components/ui/HeroHeader.tsx` (pre-existing)
Gradient hero header with decorative emoji. Props: `title` (required), `subtitle?`,
`decorations?: HeroDecoration[]`, `actions?`, `className?`, `data-testid?`.
`HeroDecoration = { emoji: string; className: string }`.

### `SectionHeader` — `components/ui/SectionHeader.tsx`
Compact title + optional subtitle header.

Props: `title` (required), `subtitle?`, `align?: "center" | "right"` (default
`center`), `data-testid?`, plus explicit `titleTestId?` / `subtitleTestId?` for
adoption. Falls back to `childTid(testId, "title" | "subtitle")`.

```tsx
import { SectionHeader } from "@/components/ui/SectionHeader";

<SectionHeader data-testid={testIds.dash.header()} title="ההתקדמות שלך" subtitle="היום" />
```

### `BackLink` — `components/ui/BackLink.tsx`
Thin wrapper over `ButtonLink` for the "חזרה…" back buttons. Props: `href`
(required), `children` (required), plus all `ButtonLink` props (`variant`,
`className`, `onClick`, `aria-label`, …).

```tsx
import { BackLink } from "@/components/ui/BackLink";

<BackLink data-testid={testIds.day.back()} href={routes.home()} variant="outline">
  חזרה למסך הבית
</BackLink>
```

### `ProgressHeader` / `ProgressBar` — `components/ui/ProgressHeader.tsx` (pre-existing)
Progress bar + label header. Wraps `ProgressBar` (`value`, `label`, `compact`).

---

## Forms / Inputs

### `Field` — `components/ui/Field.tsx`
Label + control wrapper (the admin add-user form blocks). The caller supplies the
control as children so its testid/classes stay verbatim.

Props: `label` (required), `children` (the control, required), `data-testid?`
(wrapper), `labelTestId?`, `htmlFor?`, `className?` (default `mb-3`).

```tsx
import { Field } from "@/components/ui/Field";

<Field label="שם משתמש" htmlFor="username" labelTestId={testIds.users.nameLabel()}>
  <input id="username" data-testid={testIds.users.nameInput()} className="…" />
</Field>
```

### `PinInput` — `components/ui/PinInput.tsx`
Numeric PIN entry panel (admin hub + admin progress gate). LTR password field,
inline error, full-width submit; submits on Enter and on click.

Props: `id` (required — drives `htmlFor` / `aria-describedby`), `value`, `onChange:
(value) => void`, `onSubmit: () => void`, `label`, `submitLabel`, `error?`,
`testIds: { label, input, error, submit }`.

```tsx
import { PinInput } from "@/components/ui/PinInput";

<PinInput
  id="admin-pin"
  value={pin}
  onChange={setPin}
  onSubmit={handleUnlock}
  label="הזינו קוד"
  submitLabel="כניסה"
  error={error}
  testIds={{
    label: testIds.hub.pinLabel(),
    input: testIds.hub.pinInput(),
    error: testIds.hub.pinError(),
    submit: testIds.hub.pinSubmit(),
  }}
/>
```

> Students only ever type **digits** — never re-introduce free-text. `PinInput` is
> admin-only and numeric (`inputMode="numeric"`).

---

## Feedback

### `Alert` — `components/ui/Alert.tsx`
Inline status / error banner (rounded, centered, tinted pill). `success` matches the
admin "user added/deleted" banner; `error` matches the login error.

Props: `tone: "info" | "success" | "error"` (required), `children` (required),
`data-testid?`, `className?`.

```tsx
import { Alert } from "@/components/ui/Alert";

<Alert tone="success" data-testid={testIds.users.status()}>
  המשתמש נוסף בהצלחה
</Alert>
```

### `ConfirmDialog` — `components/ui/ConfirmDialog.tsx`
Modal confirmation for a destructive or irreversible action (`role="alertdialog"`, focus-trapped,
Escape + backdrop dismiss, RTL). Owns no open/closed state — the caller does. Destructive variants
autofocus **Cancel**, so a stray Enter or a double-tap landing on the freshly-mounted dialog cannot
confirm. Name the affected subject in the body so the action is never ambiguous.

Props: `open`, `title`, `children`, `confirmLabel` (all required), `cancelLabel?` (default
`"ביטול"`), `destructive?`, `busy?`, `onConfirm`, `onCancel`,
`testIds?: { root?, confirm?, cancel?, title? }`.

```tsx
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

<ConfirmDialog
  open={pendingUser !== null}
  title="מחיקת משתמש"
  confirmLabel="מחיקה"
  destructive
  busy={isDeleting}
  onConfirm={handleDelete}
  onCancel={() => setPendingUser(null)}
  testIds={{ root: testIds.users.deleteDialog() }}
>
  האם למחוק את {pendingUser?.username}?
</ConfirmDialog>
```

### `Chip` — `components/ui/Chip.tsx` (pre-existing)
Pill badge. Props: `children`, `tone?: "neutral" | "success" | "warning" | "danger" |
"info"` (default `neutral`), `className?`, `data-testid?`, `aria-label?`.

### `Ltr` — `components/ui/Ltr.tsx`
LTR-wrapped numeral so percentages/counts/clocks render correctly inside an RTL view.
Props: `children` (required), `data-testid?`.

```tsx
import { Ltr } from "@/components/ui/Ltr";

<p>הציון שלך: <Ltr>{scorePercent}%</Ltr></p>
```

---

## Hooks

### `useAdminSession` — `lib/hooks/useAdminSession.ts`
Admin unlock lifecycle shared by AdminHubScreen and AdminProgressScreen. Reads
`isAdminUnlocked()` post-hydration; clears on `pagehide` (tab close / reload). The
unlock survives in-app navigation; `exit()` clears it explicitly.

Returns `{ isUnlocked: boolean, unlock: (pin) => boolean, exit: () => void }`.

```tsx
const { isUnlocked, unlock, exit } = useAdminSession();
if (!isUnlocked) return <PinInput onSubmit={() => unlock(pin) || setError("שגוי")} … />;
```

### `useStatusMessage<T>` — `lib/hooks/useStatusMessage.ts`
Generic success/error status-message state with optional auto-dismiss.

Options: `{ initial: T, autoDismissMs?: number, isEmpty?: (T) => boolean }`
(default `isEmpty = Boolean`). Returns `{ status, setStatus, clear }`.

```tsx
const { status, setStatus } = useStatusMessage<string>({ initial: "", autoDismissMs: 3000 });
setStatus("נשמר");
{status ? <Alert tone="success">{status}</Alert> : null}
```

### `useArmedConfirm<TId>` — `lib/hooks/useArmedConfirm.ts`
Two-step "armed → confirm/cancel" state for a family of rows. Returns `{ armedId,
isArmed(id), arm(id), disarm(), setArmedId }`. When two families coexist, call the
sibling's `disarm()` when you `arm()`.

```tsx
const day = useArmedConfirm();
<button onClick={() => day.arm(id)}>איפוס</button>
{day.isArmed(id) ? <ConfirmRow onConfirm={…} onCancel={day.disarm} /> : null}
```

---

## Utils

### Format — `lib/utils/format.ts`
Pure display formatters (numerals are wrapped in `<Ltr>` by callers where needed):
- `formatHebrewDate(iso: string | null): string` — friendly Hebrew date, `"—"` when null/unparseable.
- `formatMinutes(ms: number): string` — `"{n} דק׳"`.
- `formatClock(totalSeconds: number): string` — `mm:ss`, negatives clamp to 0.

### Sanitize — `lib/utils/sanitize.ts`
Coerce untrusted parsed-JSON into a typed record, dropping mismatched entries.
Extracted byte-for-byte from per-subject storage modules:
- `sanitizeStringRecord(value): Record<string, string>`
- `sanitizeBooleanRecord(value): Record<string, boolean>`
- `sanitizeNumberRecord(value): Record<string, number>` (also requires finite, `>= 0`)

### Guards — `lib/utils/guards.ts`
- `isBrowser(): boolean` — true only when `window` + `localStorage` exist. (Modules
  needing a *different* check, e.g. admin/tts, keep their own local variant.)
- `isObject(value): value is Record<string, unknown>` — non-null object narrow.

### Exam scorer — `lib/exam/gradeExam.ts`
`gradeExam({ correctCount, total, passPercent }): { scorePercent, passed }`. Pure
arithmetic only — **the policy (threshold + denominator) is always passed in by the
caller**. Each subject imports its own `*_PASS_PERCENT` and supplies its own total.

```ts
gradeExam({ correctCount, total: selected.length, passPercent: SCIENCE_FINAL_EXAM_PASS_PERCENT });
// → scorePercent = total > 0 ? round(correct/total*100) : 0; passed = total > 0 && scorePercent >= passPercent
```

---

## Subject screens

`lib/subjects/subjectScreenConfig.ts` + `components/screens/subject/*`
(`SubjectHomeScreen`, `SubjectLevelPickerScreen`, `SubjectDayScreen`,
`SubjectSectionScreen`, `SubjectFinalExamScreen`) unify the **English** and
**Science** subjects, which render identical markup.

Everything that differs between subjects — content/progress loaders, routes, labels,
emoji decorations, exam bank/picker/grading/storage, and testid subtrees — is
captured in a `SubjectScreenConfig` (`englishScreenConfig` / `scienceScreenConfig`).
The screens are **subject-blind**: they never branch on subject and never import a
subject store directly — they reach all data through the config.

**CRITICAL — storage & grading isolation:** each subject's config wires its OWN
content loaders, progress store, exam storage keys, and grading (each subject calls
`gradeExam` with its own `passPercent`). The shared screen never touches a threshold
or storage key — it only forwards through config callbacks. To add a third subject,
author a new `SubjectScreenConfig` (and its routes / testid subtree); do not touch
the screens.

```tsx
// app/.../page.tsx
import { scienceScreenConfig } from "@/lib/subjects/subjectScreenConfig";
import { SubjectHomeScreen } from "@/components/screens/subject/SubjectHomeScreen";

<SubjectHomeScreen config={scienceScreenConfig} level="a" />
```

---

## How to build a card / a card with a button

- **Plain card with stacked body:** use `<Card bodyClassName="space-y-2">` — the
  `bodyClassName` is the wrapper that actually applies rhythm.
- **Card with a heading + full-width CTA:** use `<ActionCard>` with `title` + `cta`.
  It applies the canonical `mt-5` CTA gap and full-width `min-h-[44px]` button.

See the `Card` and `ActionCard` snippets above.

## Gotcha: Surface swallows layout classNames

`Surface` renders `<div class="surface …"><div>{children}</div></div>`. Its
`className` lands on the **outer** wrapper (so padding works), but layout classes
meant to space the *children* (`space-y-*`, `flex`, `grid`, `gap-*`) hit that outer
single-child wrapper and are **silently ignored** — the children sit in an
un-classed inner `<div>`.

Fix:
- Prefer `<Card bodyClassName="space-y-2">` — `Card` owns a body wrapper you can
  class predictably.
- Or, if you must use `Surface` directly, add your own inner wrapper:
  `<Surface><div className="space-y-2">…</div></Surface>`.

---

## How to add a new shared component

1. **Location:** add it under `components/ui/*` (hooks → `lib/hooks/*`, utils →
   `lib/utils/*`). One component per file, named export.
2. **Forward testids:** accept `"data-testid"?` and derive child ids with
   `childTid(testId, …)` from `lib/testIds.ts` — never hardcode ids. Offer explicit
   `*TestId?` props if existing call sites need zero-diff adoption.
3. **RTL first:** default to RTL; only use `dir="ltr"` for numerals / math (wrap with
   `<Ltr>`).
4. **Touch targets ≥44px:** interactive controls go through `Button` / `ButtonLink`
   (`touch-button`) or otherwise guarantee `min-h-[44px]`.
5. **Reproduce, don't redesign:** when extracting from existing markup, match classes
   byte-for-byte so adoption is a no-op; document any new tokens in the table above.
6. **Document it here** and run `npm run check:testids` + `npm run check:cards`.
