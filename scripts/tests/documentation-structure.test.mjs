import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const docsRoot = join(root, "docs");

function walk(directory) {
  const result = [];
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) result.push(...walk(path));
    else result.push(path);
  }
  return result;
}

const requiredDocs = [
  "docs/README.md",
  "docs/01-product/PRODUCT_OVERVIEW.md",
  "docs/02-system/SYSTEM_FLOW.md",
  "docs/02-system/TECHNICAL_FLOW.md",
  "docs/02-system/SYSTEM_ARCHITECTURE.md",
  "docs/03-technology/TECH_STACK.md",
  "docs/04-design/DESIGN_SYSTEM.md",
  "docs/05-features/BUSINESS_PORTAL.md",
  "docs/05-features/WORKER_PORTAL.md",
  "docs/06-api/API_OVERVIEW.md",
  "docs/07-security/SECURITY_ARCHITECTURE.md",
  "docs/08-operations/DEPLOYMENT.md",
  "docs/09-development/LOCAL_SETUP.md",
  "docs/09-development/TESTING.md",
];

test("documentation uses the current-state feature architecture", () => {
  for (const relative of requiredDocs) {
    assert.ok(existsSync(join(root, relative)), `missing required documentation: ${relative}`);
  }

  const docs = walk(docsRoot).filter(path => path.endsWith(".md"));
  assert.ok(docs.length >= 40, `expected a comprehensive documentation set, found ${docs.length}`);

  for (const path of docs) {
    const name = path.slice(docsRoot.length + 1);
    assert.doesNotMatch(name, /(^|\/)(PHASE|P\d+_|PART\d+|part\d+|p\d+-)/, `legacy phase/part documentation returned: ${name}`);
  }
  assert.equal(existsSync(join(root, "server/docs")), false, "server/docs must not become a second documentation tree");
});

test("local markdown links resolve", () => {
  const markdownFiles = [
    join(root, "README.md"),
    join(root, "client/README.md"),
    join(root, "server/README.md"),
    ...walk(docsRoot).filter(path => path.endsWith(".md")),
  ];

  const link = /\[[^\]]+\]\(([^)]+)\)/g;
  for (const file of markdownFiles) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(link)) {
      const target = match[1].trim();
      if (!target || target.startsWith("#") || /^[a-z]+:\/\//i.test(target) || target.startsWith("mailto:")) continue;
      const fileTarget = target.split("#", 1)[0];
      if (!fileTarget) continue;
      const resolved = normalize(resolve(dirname(file), fileTarget));
      assert.ok(existsSync(resolved), `broken markdown link in ${file.slice(root.length + 1)}: ${target}`);
    }
  }
});

test("runtime knowledge and asset provenance remain outside documentation cleanup", () => {
  const knowledge = join(root, "server/src/modules/chatbot/knowledge");
  assert.ok(existsSync(knowledge), "chatbot runtime knowledge was removed");
  assert.ok(walk(knowledge).filter(path => path.endsWith(".md")).length >= 1, "chatbot runtime knowledge is empty");
  assert.ok(existsSync(join(root, "client/public/fonts/OFL-Manrope.txt")), "font license was removed");
  assert.ok(existsSync(join(root, "client/public/images/home/CREDITS.md")), "image credits were removed");
});
