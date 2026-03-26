# AI Prompt Library (kids_math)

This file contains copy/paste prompt blocks that help Cursor agents produce consistent, reviewable outputs.

## Common Sections

### Context
- Project: `Next.js App Router`, `React 18`, `TypeScript strict`, `Tailwind`, `RTL Hebrew UI`
- Relevant area: (routes/UI/storage)
- Current behavior (1-3 bullets)

### Constraints
- Follow existing conventions and keep diffs minimal.
- Respect persisted schema compatibility (add migrations/versioning if needed).
- Avoid breaking RTL/a11y.

### Acceptance Criteria
- (1) …
- (2) …
- (3) …

### Test Plan
- Automated:
  - `npm run lint`
  - `npm run build`
  - `npm run test:unit` (when logic changed)
  - `npm run test:e2e` (when gates/routes changed)
- Manual:
  - RTL critical path checks (navigation + locked/unlocked flows)
  - Keyboard sanity check for primary UI elements

## Recommended Output Format

When responding as an agent, end with:
- `Findings` (3-7 bullets, ordered by severity)
- `Files` (exact paths inspected/touched)
- `Decisions` (trade-offs)
- `Next actions` (ordered list)

