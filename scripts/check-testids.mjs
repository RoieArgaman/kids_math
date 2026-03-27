import { Project, SyntaxKind, Node } from "ts-morph";

const ROOT = process.cwd();
const TARGET_GLOBS = [
  "app/**/*.{ts,tsx}",
  "components/**/*.{ts,tsx}",
];

const INTRINSIC_TESTID_ATTR = "data-testid";
const INTRINSIC_JSX_KINDS = new Set([SyntaxKind.JsxSelfClosingElement, SyntaxKind.JsxOpeningElement]);

function isIntrinsicTagName(tagName) {
  // Intrinsic JSX element tags are lowercase (div, span, main, button, etc.)
  return /^[a-z]/.test(tagName);
}

function hasDataTestIdAttribute(openingLike) {
  return openingLike
    .getAttributes()
    .some(
      (attr) =>
        Node.isJsxAttribute(attr) &&
        attr.getNameNode?.().getText?.() === INTRINSIC_TESTID_ATTR,
    );
}

function formatIssue({ filePath, line, col, tagName }) {
  return `${filePath}:${line}:${col} missing ${INTRINSIC_TESTID_ATTR} on <${tagName}>`;
}

const project = new Project({
  tsConfigFilePath: `${ROOT}/tsconfig.json`,
  skipAddingFilesFromTsConfig: true,
});

project.addSourceFilesAtPaths(TARGET_GLOBS);

const issues = [];

for (const sourceFile of project.getSourceFiles()) {
  const filePath = sourceFile.getFilePath();

  const jsxNodes = sourceFile.getDescendants().filter((n) => INTRINSIC_JSX_KINDS.has(n.getKind()));
  for (const node of jsxNodes) {
    const tagName = node.getTagNameNode?.().getText?.() ?? null;
    if (!tagName || !isIntrinsicTagName(tagName)) continue;

    if (!hasDataTestIdAttribute(node)) {
      const pos = node.getStartLinePos();
      const { line, column } = sourceFile.getLineAndColumnAtPos(pos);
      issues.push(
        formatIssue({
          filePath: filePath.replace(`${ROOT}/`, ""),
          line,
          col: column,
          tagName,
        }),
      );
    }
  }
}

if (issues.length > 0) {
  // Print a capped list to keep logs readable; still fail hard.
  const max = 200;
  const head = issues.slice(0, max);
  console.error(`\n[check-testids] Found ${issues.length} issue(s). Showing first ${head.length}:\n`);
  for (const msg of head) console.error(msg);
  if (issues.length > max) console.error(`\n... and ${issues.length - max} more`);
  process.exit(1);
}

console.log("[check-testids] OK");

