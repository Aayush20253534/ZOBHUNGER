import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "../src/utils/http-error.js";
import { parseKnowledgeMarkdown } from "../src/modules/chatbot/knowledge/index.js";
import { createKnowledgeRetriever } from "../src/modules/chatbot/rag/index.js";
import { buildChatbotSystemPrompt, buildRetrievalQuery } from "../src/modules/chatbot/chatbot.prompt.js";
import { chatbotMessageSchema } from "../src/modules/chatbot/chatbot.schema.js";
import { createChatbotService } from "../src/modules/chatbot/chatbot.service.js";
import type { ChatbotModelClient } from "../src/modules/chatbot/chatbot.types.js";
import { createGroqClient, GroqApiError } from "../src/modules/chatbot/groq.client.js";

const PROMOTER_DOCUMENT = parseKnowledgeMarkdown(`---
id: test-promoter-service
title: Promoter Services
category: services
url: /promoter-solutions
keywords: [promoters, retail, stores]
status: published
description: Public test knowledge about ZOBHUNGER promoter services for retail businesses.
---
# Promoter Services

ZOBHUNGER can support businesses with promoter manpower for eligible retail assignments.

## How to start

Businesses can share their requirement through the public Hire Workforce flow.
`);

test("chatbot request schema trims input, defaults history and rejects private page context", () => {
  const parsed = chatbotMessageSchema.parse({ message: "  What services do you offer?  " });
  assert.equal(parsed.message, "What services do you offer?");
  assert.deepEqual(parsed.history, []);

  const privatePage = chatbotMessageSchema.safeParse({
    message: "What is this?",
    currentPage: "/business/dashboard",
  });
  assert.equal(privatePage.success, false);

  const tooMuchHistory = chatbotMessageSchema.safeParse({
    message: "Continue",
    history: Array.from({ length: 11 }, (_, index) => ({ role: index % 2 ? "assistant" : "user", content: "message" })),
  });
  assert.equal(tooMuchHistory.success, false);
});

test("retrieval query uses the previous user turn for ambiguous follow-ups", () => {
  const history = [
    { role: "user" as const, content: "Tell me about promoter services" },
    { role: "assistant" as const, content: "Promoter services can support retail execution." },
  ];
  const query = buildRetrievalQuery("How do I get this?", history);
  assert.match(query, /promoter services/i);
  assert.match(query, /Follow-up: How do I get this\?/);

  const standalone = buildRetrievalQuery(
    "Does vendor empanelment guarantee project allocation for an approved agency?",
    history,
  );
  assert.equal(standalone, "Does vendor empanelment guarantee project allocation for an approved agency?");
});

test("chatbot system prompt contains retrieved public knowledge and strict grounding rules", async () => {
  const retriever = await createKnowledgeRetriever({ documents: [PROMOTER_DOCUMENT] });
  const search = retriever.search("promoters for retail stores", { topK: 2 });
  const prompt = buildChatbotSystemPrompt(search.results, "/promoter-solutions", 5000);

  assert.match(prompt, /official public website assistant for ZOBHUNGER/i);
  assert.match(prompt, /use only the KNOWLEDGE CONTEXT/i);
  assert.match(prompt, /Promoter Services/);
  assert.match(prompt, /\/promoter-solutions/);
  assert.match(prompt, /cannot access private admin, business, worker/i);
});

test("chatbot service retrieves context, sends bounded history to the model and returns unique sources", async () => {
  const retriever = await createKnowledgeRetriever({ documents: [PROMOTER_DOCUMENT] });
  let capturedInput: unknown;
  const modelClient: ChatbotModelClient = {
    async generate(request) {
      capturedInput = request.input;
      return { text: "ZOBHUNGER can support promoter manpower. Use the Hire Workforce flow." };
    },
  };
  const service = createChatbotService({
    config: {
      enabled: true,
      maxHistoryMessages: 2,
      ragTopK: 3,
      contextMaxCharacters: 5000,
    },
    retriever,
    modelClient,
  });

  const result = await service.reply({
    message: "How can I hire promoters for retail stores?",
    currentPage: "/promoter-solutions",
    history: [
      { role: "user", content: "old user message" },
      { role: "assistant", content: "old assistant message" },
      { role: "user", content: "recent user message" },
      { role: "assistant", content: "recent assistant message" },
    ],
  });

  assert.equal(result.grounded, true);
  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0]?.url, "/promoter-solutions");
  assert.match(result.answer, /Hire Workforce/i);
  const input = capturedInput as Array<{ role: string; content: string }>;
  assert.equal(input.length, 4);
  assert.equal(input[0]?.role, "system");
  assert.equal(input[1]?.content, "recent user message");
  assert.equal(input[2]?.content, "recent assistant message");
  assert.equal(input[3]?.content, "How can I hire promoters for retail stores?");
});

test("disabled chatbot rejects before invoking the model provider", async () => {
  const retriever = await createKnowledgeRetriever({ documents: [PROMOTER_DOCUMENT] });
  let called = false;
  const service = createChatbotService({
    config: { enabled: false, maxHistoryMessages: 10, ragTopK: 3, contextMaxCharacters: 5000 },
    retriever,
    modelClient: {
      async generate() {
        called = true;
        return { text: "should not happen" };
      },
    },
  });

  await assert.rejects(
    () => service.reply({ message: "hello", history: [] }),
    (error: unknown) => error instanceof HttpError && error.statusCode === 503 && error.code === "CHATBOT_DISABLED",
  );
  assert.equal(called, false);
});

test("Groq client calls Chat Completions with server-only auth and extracts assistant text", async () => {
  let requestedUrl = "";
  let requestedInit: RequestInit | undefined;
  const fakeFetch: typeof fetch = async (input, init) => {
    requestedUrl = String(input);
    requestedInit = init;
    return new Response(JSON.stringify({
      id: "chatcmpl_test_123",
      model: "llama-3.3-70b-versatile",
      usage: {
        prompt_tokens: 120,
        completion_tokens: 30,
        total_tokens: 150,
        queue_time: 0.01,
        total_time: 0.08,
        prompt_tokens_details: { cached_tokens: 64 },
      },
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "Grounded test response" },
        },
      ],
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const client = createGroqClient({
    apiKey: "gsk_test_secret",
    baseUrl: "https://api.groq.com/openai/v1/",
    model: "llama-3.3-70b-versatile",
    timeoutMs: 5000,
    maxCompletionTokens: 700,
    temperature: 0.2,
  }, fakeFetch);

  const response = await client.generate({
    input: [
      { role: "system", content: "Use only supplied knowledge." },
      { role: "user", content: "Hello" },
    ],
    user: "hashed-client-id",
  });

  assert.equal(requestedUrl, "https://api.groq.com/openai/v1/chat/completions");
  assert.equal(new Headers(requestedInit?.headers).get("authorization"), "Bearer gsk_test_secret");
  const body = JSON.parse(String(requestedInit?.body)) as Record<string, unknown>;
  assert.equal(body.model, "llama-3.3-70b-versatile");
  assert.equal(body.max_completion_tokens, 700);
  assert.equal(body.temperature, 0.2);
  assert.equal(body.stream, false);
  assert.equal(body.user, "hashed-client-id");
  assert.deepEqual(body.messages, [
    { role: "system", content: "Use only supplied knowledge." },
    { role: "user", content: "Hello" },
  ]);
  assert.equal("store" in body, false);
  assert.equal(response.text, "Grounded test response");
  assert.equal(response.responseId, "chatcmpl_test_123");
  assert.equal(response.model, "llama-3.3-70b-versatile");
  assert.equal(response.usage?.promptTokens, 120);
  assert.equal(response.usage?.completionTokens, 30);
  assert.equal(response.usage?.totalTokens, 150);
  assert.equal(response.usage?.cachedPromptTokens, 64);
  assert.equal(response.usage?.queueDurationMs, 10);
  assert.equal(response.usage?.providerDurationMs, 80);
});

test("Groq client sends reasoning_effort only when configured", async () => {
  let requestedInit: RequestInit | undefined;
  const fakeFetch: typeof fetch = async (_input, init) => {
    requestedInit = init;
    return new Response(JSON.stringify({
      choices: [{ message: { role: "assistant", content: "Reasoned response" } }],
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const client = createGroqClient({
    apiKey: "gsk_test_secret",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "openai/gpt-oss-20b",
    timeoutMs: 5000,
    maxCompletionTokens: 700,
    temperature: 0.2,
    reasoningEffort: "low",
  }, fakeFetch);

  await client.generate({ input: [{ role: "user", content: "Hello" }] });
  const body = JSON.parse(String(requestedInit?.body)) as Record<string, unknown>;
  assert.equal(body.reasoning_effort, "low");
});

test("Groq client preserves upstream 429 metadata without leaking credentials", async () => {
  const fakeFetch: typeof fetch = async () => new Response(JSON.stringify({
    error: { message: "rate limited", code: "rate_limit_exceeded" },
  }), { status: 429, headers: { "retry-after": "7", "content-type": "application/json" } });

  const client = createGroqClient({
    apiKey: "gsk_secret_never_returned",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    timeoutMs: 5000,
    maxCompletionTokens: 700,
    temperature: 0.2,
  }, fakeFetch);

  await assert.rejects(
    () => client.generate({ input: [{ role: "user", content: "Hello" }] }),
    (error: unknown) => {
      assert.ok(error instanceof GroqApiError);
      assert.equal(error.status, 429);
      assert.equal(error.retryAfterSeconds, 7);
      assert.doesNotMatch(error.message, /gsk_secret_never_returned/);
      return true;
    },
  );
});

test("chatbot service maps Groq rate limiting to a stable public API error", async () => {
  const retriever = await createKnowledgeRetriever({ documents: [PROMOTER_DOCUMENT] });
  const service = createChatbotService({
    config: { enabled: true, maxHistoryMessages: 10, ragTopK: 3, contextMaxCharacters: 5000 },
    retriever,
    modelClient: {
      async generate() {
        throw new GroqApiError("provider detail", { status: 429, retryAfterSeconds: 9 });
      },
    },
  });

  await assert.rejects(
    () => service.reply({ message: "promoter services", history: [] }),
    (error: unknown) => error instanceof HttpError
      && error.statusCode === 503
      && error.code === "CHATBOT_UPSTREAM_RATE_LIMITED"
      && (error.details as { retryAfterSeconds?: number })?.retryAfterSeconds === 9,
  );
});
