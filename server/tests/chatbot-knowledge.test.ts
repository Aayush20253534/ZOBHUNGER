import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  loadKnowledgeBase,
  parseKnowledgeMarkdown,
  validateKnowledgeBase,
} from "../src/modules/chatbot/knowledge/index.js";

const VALID_DOCUMENT = `---
id: workforce-solutions
title: Workforce Solutions
category: services
url: /workforce-solutions
keywords:
  - workforce
  - manpower
aliases: [staffing, deployment]
status: published
description: Public facts about workforce services provided by ZOBHUNGER to business customers.
updatedAt: 2026-09-11
---

# Workforce Solutions

ZOBHUNGER provides workforce solutions for businesses that need structured staffing and deployment support. This test body is intentionally long enough to represent a useful published knowledge document.
`;

test("knowledge parser reads strict frontmatter and markdown body", () => {
  const document = parseKnowledgeMarkdown(VALID_DOCUMENT, {
    absolutePath: "/tmp/services/workforce-solutions.md",
    relativePath: "services/workforce-solutions.md",
  });

  assert.equal(document.metadata.id, "workforce-solutions");
  assert.equal(document.metadata.category, "services");
  assert.deepEqual(document.metadata.keywords, ["workforce", "manpower"]);
  assert.deepEqual(document.metadata.aliases, ["staffing", "deployment"]);
  assert.match(document.body, /^# Workforce Solutions/);
});

test("knowledge parser rejects protected private website routes", () => {
  const privateDocument = VALID_DOCUMENT.replace(
    "url: /workforce-solutions",
    "url: /worker/profile",
  );

  assert.throws(
    () => parseKnowledgeMarkdown(privateDocument),
    /private worker routes cannot be indexed/,
  );
});

test("knowledge loader excludes draft and archived files by default", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "zobhunger-knowledge-"));
  try {
    await mkdir(path.join(root, "services"), { recursive: true });
    await writeFile(path.join(root, "services", "published.md"), VALID_DOCUMENT, "utf8");
    await writeFile(
      path.join(root, "services", "draft.md"),
      VALID_DOCUMENT.replace("id: workforce-solutions", "id: workforce-solutions-draft").replace(
        "status: published",
        "status: draft",
      ),
      "utf8",
    );
    await writeFile(
      path.join(root, "services", "archived.md"),
      VALID_DOCUMENT.replace("id: workforce-solutions", "id: workforce-solutions-archived").replace(
        "status: published",
        "status: archived",
      ),
      "utf8",
    );

    const result = await loadKnowledgeBase({ rootDir: root });
    assert.equal(result.issues.length, 0);
    assert.deepEqual(result.documents.map((document) => document.metadata.id), ["workforce-solutions"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("knowledge validator catches duplicate ids and category path mismatches", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "zobhunger-knowledge-"));
  try {
    await mkdir(path.join(root, "services"), { recursive: true });
    await mkdir(path.join(root, "company"), { recursive: true });
    await writeFile(path.join(root, "services", "one.md"), VALID_DOCUMENT, "utf8");
    await writeFile(
      path.join(root, "company", "two.md"),
      VALID_DOCUMENT.replace("url: /workforce-solutions", "url: /about-workforce"),
      "utf8",
    );

    const result = await validateKnowledgeBase({ rootDir: root });
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((issue) => issue.code === "DUPLICATE_ID"));
    assert.ok(result.issues.some((issue) => issue.code === "CATEGORY_PATH_MISMATCH"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("repository knowledge corpus covers the current public website surface", async () => {
  const result = await loadKnowledgeBase();
  assert.equal(result.issues.length, 0);
  assert.equal(result.documents.length, 46);

  const categoryCounts = result.documents.reduce<Record<string, number>>((counts, document) => {
    counts[document.metadata.category] = (counts[document.metadata.category] ?? 0) + 1;
    return counts;
  }, {});

  assert.equal(categoryCounts.services, 10);
  assert.equal(categoryCounts.industries, 11);
  assert.equal(categoryCounts["case-studies"], 8);
  assert.equal(categoryCounts.company, 7);
  assert.equal(categoryCounts.partnerships, 3);
  assert.equal(categoryCounts.jobs, 3);
  assert.equal(categoryCounts.businesses, 2);
  assert.equal(categoryCounts.workers, 1);
  assert.equal(categoryCounts.contact, 1);

  const ids = new Set(result.documents.map((document) => document.metadata.id));
  for (const expectedId of [
    "website-overview",
    "workforce-solutions",
    "telecaller-telesales-services",
    "industry-retail",
    "for-business",
    "for-workers",
    "vendor-empanelment",
    "placement-cell-partnership",
    "jobs-overview",
    "contact-zobhunger",
  ]) {
    assert.ok(ids.has(expectedId), `expected published knowledge document: ${expectedId}`);
  }

  const protectedPrefixes = ["/admin", "/business", "/worker", "/employee-joining"];
  for (const document of result.documents) {
    assert.equal(
      protectedPrefixes.some(
        (prefix) =>
          document.metadata.url === prefix || document.metadata.url.startsWith(`${prefix}/`),
      ),
      false,
      `published knowledge must not target a protected route: ${document.metadata.id}`,
    );
  }
});
