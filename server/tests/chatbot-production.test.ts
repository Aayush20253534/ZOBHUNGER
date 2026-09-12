import assert from "node:assert/strict";
import test from "node:test";
import type { CacheTransport } from "../src/cache/json-cache.js";
import { chatbotAbuseGuard, chatbotClientFingerprint, chatbotDuplicateDigest, resetChatbotAbuseGuardForTests } from "../src/modules/chatbot/chatbot-abuse.middleware.js";
import { createChatbotResponseCache } from "../src/modules/chatbot/chatbot.cache.js";
import { ChatbotMetrics } from "../src/modules/chatbot/chatbot.metrics.js";
import { createChatbotService } from "../src/modules/chatbot/chatbot.service.js";
import { parseKnowledgeMarkdown } from "../src/modules/chatbot/knowledge/index.js";
import { createKnowledgeRetriever } from "../src/modules/chatbot/rag/index.js";
import type { ChatbotModelClient } from "../src/modules/chatbot/chatbot.types.js";
import { env } from "../src/config/env.js";

function document(body: string) {
  return parseKnowledgeMarkdown(`---
id: cache-test
 title: Cache Test
category: services
url: /cache-test
keywords: [cache, workforce]
status: published
description: Test chatbot cache knowledge.
---
# Cache Test

${body}
`.replace("\n title:", "\ntitle:"));
}

class MemoryTransport implements CacheTransport {
  ready = true;
  values = new Map<string, string>();
  isReady() { return this.ready; }
  async command(args: string[]): Promise<unknown> {
    const [command, key, value] = args;
    if (command === "GET") return this.values.get(key ?? "") ?? null;
    if (command === "SET") {
      if (!key || value === undefined) throw new Error("invalid SET");
      this.values.set(key, value);
      return "OK";
    }
    throw new Error(`unsupported command ${command}`);
  }
}

test("knowledge fingerprint changes when public knowledge content changes", async () => {
  const first = await createKnowledgeRetriever({ documents: [document("ZOBHUNGER provides workforce support.")] });
  const same = await createKnowledgeRetriever({ documents: [document("ZOBHUNGER provides workforce support.")] });
  const changed = await createKnowledgeRetriever({ documents: [document("ZOBHUNGER provides updated workforce support.")] });
  assert.equal(first.fingerprint, same.fingerprint);
  assert.notEqual(first.fingerprint, changed.fingerprint);
  assert.match(first.fingerprint, /^[a-f0-9]{64}$/);
});

test("chatbot response cache reuses grounded answers and cache key includes knowledge/model versions", async () => {
  const transport = new MemoryTransport();
  const cache = createChatbotResponseCache({ enabled: true, prefix: "test", ttlSeconds: 300, transport });
  let loads = 0;
  const lookup = {
    message: "What workforce services do you offer?",
    currentPage: "/services",
    knowledgeFingerprint: "knowledge-a",
    modelSignature: "model-a",
  };
  const load = async () => {
    loads += 1;
    return { answer: "Grounded answer", grounded: true, sources: [{ title: "Service", url: "/services", category: "services" as const }] };
  };

  const first = await cache.remember(lookup, load);
  const second = await cache.remember(lookup, load);
  const changedKnowledge = await cache.remember({ ...lookup, knowledgeFingerprint: "knowledge-b" }, load);

  assert.equal(first.status, "miss");
  assert.equal(second.status, "hit");
  assert.equal(changedKnowledge.status, "miss");
  assert.equal(loads, 2);
});

test("chatbot response cache never stores ungrounded answers", async () => {
  const transport = new MemoryTransport();
  const cache = createChatbotResponseCache({ enabled: true, prefix: "test", ttlSeconds: 300, transport });
  let loads = 0;
  const load = async () => {
    loads += 1;
    return { answer: "I do not have that information.", grounded: false, sources: [] };
  };
  const lookup = { message: "quantum rockets", knowledgeFingerprint: "knowledge", modelSignature: "model" };
  await cache.remember(lookup, load);
  await cache.remember(lookup, load);
  assert.equal(loads, 2);
});

test("chatbot service caches only history-free turns and forwards hashed client identity to provider", async () => {
  const retriever = await createKnowledgeRetriever({ documents: [document("Businesses can request workforce through the public flow.")] });
  const transport = new MemoryTransport();
  const responseCache = createChatbotResponseCache({ enabled: true, prefix: "test", ttlSeconds: 300, transport });
  let modelCalls = 0;
  let seenUser: string | undefined;
  const modelClient: ChatbotModelClient = {
    async generate(request) {
      modelCalls += 1;
      seenUser = request.user;
      return {
        text: "Use the public workforce flow.",
        usage: { promptTokens: 100, completionTokens: 20, totalTokens: 120, providerDurationMs: 25 },
      };
    },
  };
  const metrics = new ChatbotMetrics();
  const service = createChatbotService({
    config: {
      enabled: true,
      maxHistoryMessages: 10,
      ragTopK: 3,
      contextMaxCharacters: 5000,
      cacheEnabled: true,
      modelSignature: "test-model-v1",
    },
    retriever,
    modelClient,
    responseCache,
    metrics,
  });
  const request = { requestId: "req-test", clientFingerprint: "abcdef0123456789" };

  await service.reply({ message: "How do I request workforce?", history: [] }, request);
  await service.reply({ message: "How do I request workforce?", history: [] }, request);
  assert.equal(modelCalls, 1);
  assert.equal(seenUser, "abcdef0123456789");

  await service.reply({
    message: "How do I request workforce?",
    history: [{ role: "user", content: "Tell me about workforce" }],
  }, request);
  assert.equal(modelCalls, 2);

  const snapshot = metrics.snapshot();
  assert.equal(snapshot.requests, 3);
  assert.equal(snapshot.cache.hits, 1);
  assert.equal(snapshot.cache.misses, 1);
  assert.equal(snapshot.cache.bypasses, 1);
  assert.equal(snapshot.tokens.total, 240);
});

test("chatbot metrics expose bounded aggregate operational counters", () => {
  const metrics = new ChatbotMetrics();
  metrics.record({ ok: true, grounded: true, cacheStatus: "miss", durationMs: 100, providerDurationMs: 80, totalTokens: 50 });
  metrics.record({ ok: true, grounded: true, cacheStatus: "hit", durationMs: 10 });
  metrics.record({ ok: false, cacheStatus: "bypass", durationMs: 40 });
  const snapshot = metrics.snapshot();
  assert.equal(snapshot.requests, 3);
  assert.equal(snapshot.successes, 2);
  assert.equal(snapshot.errors, 1);
  assert.equal(snapshot.cache.hitRate, 0.5);
  assert.equal(snapshot.tokens.total, 50);
  assert.equal(snapshot.latency.averageMs, 50);
});

test("duplicate abuse keys are normalized and client identity is server-keyed", () => {
  const first = chatbotDuplicateDigest({ message: "  Hire   Workforce ", currentPage: "/for-business" });
  const second = chatbotDuplicateDigest({ message: "hire workforce", currentPage: "/for-business" });
  assert.equal(first, second);
  assert.notEqual(first, chatbotDuplicateDigest({ message: "hire workforce", currentPage: "/jobs" }));

  const fingerprint = chatbotClientFingerprint({ ip: "203.0.113.7", socket: { remoteAddress: "203.0.113.7" } } as never);
  assert.match(fingerprint, /^[a-f0-9]{32}$/);
  assert.doesNotMatch(fingerprint, /203\.0\.113\.7/);
});

test("duplicate abuse guard eventually rejects repeated identical messages", async () => {
  resetChatbotAbuseGuardForTests();
  const req = { ip: "203.0.113.9", socket: { remoteAddress: "203.0.113.9" } } as never;
  let lastStatus = 0;
  let lastBody: unknown;
  const res = {
    locals: { validated: { body: { message: "same chatbot question", history: [] } } },
    set() { return this; },
    status(code: number) { lastStatus = code; return this; },
    json(body: unknown) { lastBody = body; return this; },
  } as never;

  for (let index = 0; index < env.CHATBOT_DUPLICATE_MAX + 1; index += 1) {
    let proceeded = false;
    await chatbotAbuseGuard(req, res, () => { proceeded = true; });
    if (index < env.CHATBOT_DUPLICATE_MAX) assert.equal(proceeded, true);
  }
  assert.equal(lastStatus, 429);
  assert.match(JSON.stringify(lastBody), /CHATBOT_DUPLICATE_MESSAGE_LIMIT/);
});
