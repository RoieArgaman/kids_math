## Automated checks (repo quality gates)

Run these for pedagogy/content/progress/UX changes:

1. Lint

```bash
npm run lint
```

2. Build

```bash
npm run build
```

3. Unit tests (required when logic changes: sequencing/progress/hints)

```bash
npm run test:unit
```

4. E2E (required when routing/gates/screens change)

```bash
npm run test:e2e
```

## Manual RTL spot-check (fast)

- **Home → Plan → Day**
  - Select grade, open a day, answer a few questions, verify feedback and “retry hint” after 3rd attempt.
- **Hints quality**
  - For `number-bonds` exercises, confirm hint suggests “להשלים ל-10”.
  - For `number-line` pictorial exercises, confirm hint suggests drawing/using a number line.
- **Keyboard**
  - Tab/Shift+Tab reaches input and check/next buttons in a sensible order.
- **Touch**
  - Primary action buttons feel ~44–52px tall and are easy to tap.

