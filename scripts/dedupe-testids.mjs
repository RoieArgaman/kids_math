import { Project, SyntaxKind, Node } from "ts-morph";

const ROOT = process.cwd();
const TARGET_GLOBS = ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"];
const TEST_ID_ATTR = "data-testid";

function isIntrinsicTagName(name) {
  return /^[a-z]/.test(name);
}

function getTagName(node) {
  const t = node.getTagNameNode?.();
  return t ? t.getText() : null;
}

const project = new Project({
  tsConfigFilePath: `${ROOT}/tsconfig.json`,
  skipAddingFilesFromTsConfig: true,
});

project.addSourceFilesAtPaths(TARGET_GLOBS);

let removed = 0;
let touched = 0;

for (const sourceFile of project.getSourceFiles()) {
  let changed = false;
  const jsxOpeners = sourceFile
    .getDescendants()
    .filter((n) => Node.isJsxOpeningElement(n) || Node.isJsxSelfClosingElement(n));

  for (const opener of jsxOpeners) {
    const tag = getTagName(opener);
    if (!tag || !isIntrinsicTagName(tag)) continue;

    const attrs = opener.getAttributes().filter((a) => Node.isJsxAttribute(a));
    const testIdAttrs = attrs.filter((a) => a.getNameNode().getText() === TEST_ID_ATTR);
    if (testIdAttrs.length <= 1) continue;

    // Keep the first, remove the rest.
    for (const extra of testIdAttrs.slice(1)) {
      extra.remove();
      removed += 1;
      changed = true;
    }
  }

  if (changed) {
    sourceFile.formatText({ indentSize: 2 });
    touched += 1;
  }
}

await project.save();
console.log(`[dedupe-testids] Touched ${touched} file(s), removed ${removed} duplicate data-testid attribute(s).`);

