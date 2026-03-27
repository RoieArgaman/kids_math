import { Project, SyntaxKind, Node } from "ts-morph";

const ROOT = process.cwd();
const TARGET_GLOBS = ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"];
const TEST_ID_ATTR = "data-testid";

function normalizeForId(input) {
  const trimmed = String(input ?? "").trim().toLowerCase();
  if (!trimmed) return "x";
  return trimmed
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "") || "x";
}

function isIntrinsicTagName(name) {
  return /^[a-z]/.test(name);
}

function hasAttr(node, attrName) {
  return node
    .getAttributes()
    .some(
      (a) =>
        a.getKind() === SyntaxKind.JsxAttribute &&
        a.getNameNode?.().getText?.() === attrName,
    );
}

function getTagName(node) {
  const t = node.getTagNameNode?.();
  return t ? t.getText() : null;
}

function findNearestBaseTestId(node) {
  // Look up the tree for an intrinsic element that already has data-testid="...".
  let cur = node.getParent();
  while (cur) {
    if (
      (Node.isJsxSelfClosingElement(cur) || Node.isJsxOpeningElement(cur)) &&
      isIntrinsicTagName(getTagName(cur) ?? "") &&
      hasAttr(cur, TEST_ID_ATTR)
    ) {
      const attr = cur
        .getAttributes()
        .find((a) => a.getKind() === SyntaxKind.JsxAttribute && a.getName?.() === TEST_ID_ATTR);
      const initializer = attr?.getFirstChildByKind(SyntaxKind.StringLiteral) ?? attr?.getFirstChildByKind(SyntaxKind.JsxExpression);
      if (initializer) {
        // Extract raw text; if expression, just use its text as base (best-effort).
        return initializer.getText().replace(/^["']|["']$/g, "");
      }
    }
    cur = cur.getParent();
  }
  return null;
}

const project = new Project({
  tsConfigFilePath: `${ROOT}/tsconfig.json`,
  skipAddingFilesFromTsConfig: true,
});
project.addSourceFilesAtPaths(TARGET_GLOBS);

let changedFiles = 0;
let addedCount = 0;

for (const sourceFile of project.getSourceFiles()) {
  let changed = false;

  const jsxOpeners = sourceFile
    .getDescendants()
    .filter((n) => Node.isJsxOpeningElement(n) || Node.isJsxSelfClosingElement(n));

  let fileNodeIdx = 0;
  for (const opener of jsxOpeners) {
    const tagName = getTagName(opener);
    if (!tagName || !isIntrinsicTagName(tagName)) continue;
    if (hasAttr(opener, TEST_ID_ATTR)) continue;

    const base = findNearestBaseTestId(opener);
    const path = `node.idx.${fileNodeIdx++}`;
    const id = base ? `${base}.el.${normalizeForId(path)}` : `km.autogen.${normalizeForId(sourceFile.getBaseNameWithoutExtension())}.${normalizeForId(path)}`;

    // Insert as first attribute to keep diffs consistent.
    opener.insertAttributes(0, [{ name: TEST_ID_ATTR, initializer: `"${id}"` }]);
    changed = true;
    addedCount += 1;
  }

  if (changed) {
    sourceFile.formatText({ indentSize: 2 });
    changedFiles += 1;
  }
}

await project.save();

console.log(`[add-missing-testids] Updated ${changedFiles} file(s), added ${addedCount} data-testid attribute(s).`);

