import assert from "node:assert/strict";
import test from "node:test";
import { loadKnowledgeBase, parseKnowledgeMarkdown } from "../src/modules/chatbot/knowledge/index.js";
import {
  buildKnowledgeIndex,
  chunkKnowledgeDocument,
  createKnowledgeRetriever,
  formatKnowledgeContext,
} from "../src/modules/chatbot/rag/index.js";

const LONG_SECTION = Array.from(
  { length: 18 },
  (_, index) => `Paragraph ${index + 1} explains a detailed operational requirement for workforce deployment, reporting, locations and responsibilities so the section is long enough to require deterministic chunk splitting.`,
).join("\n\n");

const CHUNKING_DOCUMENT = parseKnowledgeMarkdown(`---
id: chunking-example
title: Chunking Example
category: services
url: /chunking-example
keywords: [chunking, workforce]
status: published
description: Synthetic document used to verify heading-aware knowledge chunking behavior in the local RAG engine.
---
# Chunking Example

Introductory information about the service and its public purpose.

## Service scope

${LONG_SECTION}

## How to start

Share the role, location and duration with ZOBHUNGER.
`);

test("RAG chunker keeps section provenance and enforces practical chunk sizes", () => {
  const chunks = chunkKnowledgeDocument(CHUNKING_DOCUMENT, {
    targetChars: 900,
    maxChars: 1200,
    overlapChars: 100,
  });

  assert.ok(chunks.length >= 4);
  assert.ok(chunks.every((chunk) => chunk.documentId === "chunking-example"));
  assert.ok(chunks.every((chunk) => chunk.content.length <= 1200));
  assert.ok(chunks.some((chunk) => chunk.section === "Service scope"));
  assert.ok(chunks.some((chunk) => chunk.section === "How to start"));
  assert.ok(chunks.every((chunk) => chunk.sectionPath[0] === "Chunking Example"));
});

test("RAG index builds searchable chunks from the published repository corpus", async () => {
  const loaded = await loadKnowledgeBase();
  assert.equal(loaded.issues.length, 0);

  const index = buildKnowledgeIndex(loaded.documents);
  assert.equal(index.documentCount, 46);
  assert.ok(index.chunkCount > index.documentCount);
  assert.equal(index.chunks.length, index.chunkCount);
  assert.ok(index.documentFrequency.size > 100);
});

test("RAG retrieval ranks promoter and retail knowledge for a retail promoter requirement", async () => {
  const retriever = await createKnowledgeRetriever();
  const response = retriever.search("I need promoters for my retail stores", {
    topK: 5,
    includeDebug: true,
  });

  const ids = response.results.map((result) => result.chunk.documentId);
  assert.equal(ids[0], "promoter-solutions");
  assert.ok(ids.includes("industry-retail"));
  assert.ok(ids.includes("retail-execution"));
  assert.ok(response.results[0]?.debug?.matchedTerms.includes("promoter"));
});

test("RAG retrieval finds vendor empanelment for an agency onboarding question", async () => {
  const retriever = await createKnowledgeRetriever();
  const response = retriever.search("How can my agency become a vendor and get a vendor code?", {
    topK: 3,
  });

  assert.equal(response.results[0]?.chunk.documentId, "vendor-empanelment");
});

test("RAG retrieval surfaces the vendor project-allocation caveat when it is asked about", async () => {
  const retriever = await createKnowledgeRetriever();
  const response = retriever.search("Does vendor empanelment guarantee project allocation?", {
    topK: 3,
  });

  assert.equal(response.results[0]?.chunk.documentId, "vendor-empanelment");
  assert.match(response.results[0]?.chunk.content ?? "", /does not guarantee project allocation/i);
});

test("RAG retrieval separates public jobs from fictional demo vacancies", async () => {
  const retriever = await createKnowledgeRetriever();
  const response = retriever.search("Are the jobs on the website live vacancies or demo jobs?", {
    topK: 4,
  });

  assert.equal(response.results[0]?.chunk.documentId, "jobs-overview");
  assert.match(response.results[0]?.chunk.content ?? "", /fictional examples|not live vacancies/i);
});

test("RAG retrieval can use the current page as a contextual ranking signal", async () => {
  const retriever = await createKnowledgeRetriever();
  const withoutPage = retriever.search("How do I start this service?", { topK: 3 });
  const withPage = retriever.search("How do I start this service?", {
    topK: 3,
    currentPage: "/verification-services",
  });

  assert.notEqual(withoutPage.results[0]?.chunk.documentId, "verification-services");
  assert.equal(withPage.results[0]?.chunk.documentId, "verification-services");
});

test("RAG retrieval returns no context for a completely unrelated query", async () => {
  const retriever = await createKnowledgeRetriever();
  const response = retriever.search("quantum entanglement superconducting qubits", { topK: 5 });
  assert.deepEqual(response.results, []);
});

test("RAG context formatter produces bounded source-labelled context for the future Grok layer", async () => {
  const retriever = await createKnowledgeRetriever();
  const response = retriever.search("What email should I use for a business enquiry?", { topK: 3 });
  const context = formatKnowledgeContext(response.results, { maxCharacters: 5000 });

  assert.match(context, /\[SOURCE 1\]/);
  assert.match(context, /URL: \/contact/);
  assert.match(context, /business@zobhungr\.com|help@zobhungr\.com/i);
  assert.ok(context.length <= 5000);
});
