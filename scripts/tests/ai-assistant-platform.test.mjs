import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const text = (relative) => readFile(path.join(root, relative), "utf8");

test("AI assistant hard-gates unsupported answers and supports hybrid retrieval plus reranking", async () => {
  const service = await text("server/src/modules/chatbot/chatbot.service.ts");
  const search = await text("server/src/modules/chatbot/rag/knowledge-search.ts");
  const reranker = await text("server/src/modules/chatbot/chatbot.reranker.ts");
  const prompt = await text("server/src/modules/chatbot/chatbot.prompt.ts");
  const language = await text("server/src/modules/chatbot/chatbot.language.ts");
  assert.match(service, /initialTopScore < threshold/);
  assert.match(language, /don[’']t have enough verified ZOBHUNGER information/i);
  assert.match(service, /rerankKnowledgeResults/);
  assert.match(search, /semanticScore/);
  assert.match(search, /scoreSemanticConcepts/);
  assert.match(reranker, /retrieval reranker/i);
  assert.match(prompt, /For every ZOBHUNGER-specific factual claim[\s\S]*use only the context below/i);
});

test("conversation memory and analytics persist privacy-bounded assistant events", async () => {
  const schema = await text("server/prisma/schema.prisma");
  const memory = await text("server/src/modules/chatbot/chatbot.memory.ts");
  const admin = await text("server/src/modules/chatbot/admin/chatbot-admin.service.ts");
  assert.match(schema, /model ChatbotConversation/);
  assert.match(schema, /model ChatbotMessage/);
  assert.match(memory, /loadConversationMemory/);
  assert.match(memory, /persistConversationTurn/);
  assert.match(memory, /clientFingerprint/);
  assert.match(admin, /topUnanswered/);
  assert.match(admin, /averageLatencyMs/);
});

test("lead generation and human handover join the normal intake workflow", async () => {
  const routes = await text("server/src/modules/chatbot/chatbot.routes.ts");
  const leads = await text("server/src/modules/chatbot/chatbot.leads.ts");
  const widget = await text("client/src/components/chatbot/ChatbotLeadForm.tsx");
  const intakeUi = await text("client/src/components/admin/AdminOperationsIntake.tsx");
  assert.match(routes, /chatbotRouter\.post\([\s\S]*"\/leads"/);
  assert.match(leads, /IntakeSourceType\.CHATBOT_LEAD/);
  assert.match(leads, /departmentFor/);
  assert.match(widget, /Human handover/);
  assert.match(widget, /not to the AI model/);
  assert.match(intakeUi, /CHATBOT_LEAD/);
  assert.match(intakeUi, /AI assistant enquiry/);
});

test("managed knowledge is verified, RBAC protected and refreshes live retrieval without code changes", async () => {
  const permission = await text("server/src/middlewares/admin-permission.middleware.ts");
  const service = await text("server/src/modules/chatbot/admin/chatbot-admin.service.ts");
  const managed = await text("server/src/modules/chatbot/knowledge/managed-knowledge.ts");
  const nav = await text("client/src/data/admin-navigation.ts");
  const page = await text("client/src/components/admin/AdminAiAssistant.tsx");
  assert.match(permission, /AI_ASSISTANT_MANAGE/);
  assert.match(service, /verifiedByUserId/);
  assert.match(service, /refreshChatbotRuntime/);
  assert.match(managed, /status: "PUBLISHED"/);
  assert.match(managed, /verifiedAt: \{ not: null \}/);
  assert.match(nav, /\/admin\/ai-assistant/);
  assert.match(page, /Managed knowledge base/);
});

test("the public assistant exposes separate business flows, official form links and secure handover actions", async () => {
  const audiences = await text("server/src/modules/chatbot/chatbot.audience.ts");
  const panel = await text("client/src/components/chatbot/ChatbotPanel.tsx");
  for (const route of ["/jobs", "/careers", "/hire-workforce", "/vendor-empanelment", "/become-a-partner", "/contact"]) assert.match(audiences, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(panel, /Jobs/);
  assert.match(panel, /Business/);
  assert.match(panel, /Vendor \/ Partner/);
  assert.match(panel, /General/);
});

test("AI assistant migration keeps new enum grant in a separate committed migration", async () => {
  const main = await text("server/prisma/migrations/20260919100000_ai_assistant_platform/migration.sql");
  const grant = await text("server/prisma/migrations/20260919101000_ai_assistant_main_admin_permission/migration.sql");
  assert.match(main, /ADD VALUE IF NOT EXISTS 'AI_ASSISTANT_MANAGE'/);
  assert.doesNotMatch(main, /array_append\("adminPermissions", 'AI_ASSISTANT_MANAGE'/);
  assert.match(grant, /array_append\("adminPermissions", 'AI_ASSISTANT_MANAGE'/);
});

test("offline chatbot release checks do not eagerly depend on runtime Prisma wiring", async () => {
  const retriever = await text("server/src/modules/chatbot/rag/knowledge-retriever.ts");
  const verifier = await text("scripts/verify-phase2.mjs");
  assert.doesNotMatch(retriever, /^import \{ loadPublishedManagedKnowledge \} from/m);
  assert.match(retriever, /await import\("\.\.\/knowledge\/managed-knowledge\.js"\)/);
  assert.match(verifier, /name: "Generate Prisma client"[\s\S]*script: "db:generate"[\s\S]*name: "Server unit tests"/);
});

test("P0 dense retrieval uses native Gemini embeddings, pgvector and reciprocal-rank fusion with fallback", async () => {
  const migration = await text("server/prisma/migrations/20260919110000_ai_assistant_p0_p1/migration.sql");
  const vector = await text("server/src/modules/chatbot/rag/vector-retrieval.ts");
  const embedding = await text("server/src/modules/chatbot/rag/embedding.client.ts");
  const runtime = await text("server/src/modules/chatbot/chatbot.runtime.ts");
  const env = await text("server/src/config/env.ts");
  const driftCheck = await text("server/scripts/check-schema-drift.mjs");
  const verifier = await text("scripts/verify-phase2.mjs");
  assert.match(migration, /CREATE EXTENSION IF NOT EXISTS vector/);
  assert.match(migration, /vector\(1536\)/);
  assert.match(migration, /USING hnsw/);
  assert.match(vector, /rrfFuse/);
  assert.match(vector, /chatbot\.vector\.fallback/);
  assert.match(vector, /embedDocuments/);
  assert.match(vector, /embedQueries/);
  assert.match(vector, /embeddingProvider: "gemini"/);
  assert.match(vector, /syncKey = `\$\{retriever\.fingerprint\}:\$\{client\.model\}:\$\{client\.dimensions\}`/);
  assert.match(embedding, /:batchEmbedContents/);
  assert.match(embedding, /x-goog-api-key/);
  assert.match(embedding, /outputDimensionality: EMBEDDING_DIMENSIONS/);
  assert.match(embedding, /task: search result \| query:/);
  assert.match(embedding, /title: \${input\.title/);
  assert.doesNotMatch(embedding, /Authorization:\s*`Bearer/);
  assert.match(runtime, /createGeminiEmbeddingClient/);
  assert.match(runtime, /GEMINI_API_KEY/);
  assert.match(env, /gemini-embedding-2/);
  assert.doesNotMatch(env, /CHATBOT_EMBEDDING_/);
  assert.match(driftCheck, /ChatbotKnowledgeEmbedding_embedding_hnsw_idx/);
  assert.match(driftCheck, /USING\\s\+hnsw/);
  assert.match(driftCheck, /Removed index on columns \(embedding\)/);
  assert.match(driftCheck, /Unexpected database\/schema drift detected/);
  assert.match(verifier, /scripts\/check-schema-drift\.mjs/);
});

test("P0 answers enforce source citations and expose a live answer-quality evaluator", async () => {
  const service = await text("server/src/modules/chatbot/chatbot.service.ts");
  const citations = await text("server/src/modules/chatbot/chatbot.citations.ts");
  const evaluator = await text("server/src/modules/chatbot/evaluation/evaluate-answers.ts");
  const packageJson = await text("server/package.json");
  assert.match(service, /validateAnswerCitations/);
  assert.match(service, /citationRepairPrompt/);
  assert.match(citations, /\[S\$\{index \+ 1\}\]/);
  assert.match(evaluator, /citationAccuracy/);
  assert.match(evaluator, /forbiddenClaimSafety/);
  assert.match(packageJson, /chatbot:evaluate:answers/);
});

test("P0 authenticated context and P1 tools enforce server-derived roles and explicit write confirmation", async () => {
  const routes = await text("server/src/modules/chatbot/chatbot.routes.ts");
  const controller = await text("server/src/modules/chatbot/chatbot.controller.ts");
  const tools = await text("server/src/modules/chatbot/chatbot.tools.ts");
  const widget = await text("client/src/components/chatbot/ChatbotWidget.tsx");
  assert.match(routes, /optionalAuth/);
  assert.match(routes, /\/tools\/execute/);
  assert.match(routes, /requireAuth/);
  assert.match(controller, /authUser/);
  assert.match(tools, /worker\.job_match/);
  assert.match(tools, /business\.requirement_copilot/);
  assert.match(tools, /business\.save_requirement_draft/);
  assert.match(widget, /confirmationRequired/);
  assert.match(widget, /executeChatbotTool/);
});

test("P1 decomposition, multilingual responses and managed knowledge freshness are wired end to end", async () => {
  const service = await text("server/src/modules/chatbot/chatbot.service.ts");
  const decomposition = await text("server/src/modules/chatbot/chatbot.decomposition.ts");
  const language = await text("server/src/modules/chatbot/chatbot.language.ts");
  const managed = await text("server/src/modules/chatbot/knowledge/managed-knowledge.ts");
  const admin = await text("client/src/components/admin/AdminAiAssistant.tsx");
  assert.match(service, /decomposeChatbotQuery/);
  assert.match(decomposition, /unique\.length >= 4/);
  assert.match(language, /hinglish/);
  assert.match(language, /[\u0900-\u097F]/u);
  assert.match(managed, /reviewDueAt/);
  assert.match(managed, /validUntil/);
  assert.match(admin, /Source version/);
  assert.match(admin, /Review due/);
});

test("authenticated tool answers are excluded from public cache and persistent conversation history", async () => {
  const service = await text("server/src/modules/chatbot/chatbot.service.ts");
  const widget = await text("client/src/components/chatbot/ChatbotWidget.tsx");
  const storage = await text("client/src/lib/chatbot-storage.ts");
  assert.match(service, /!request\.actor/);
  assert.match(service, /memoryEnabled && input\.conversationId && !request\.actor/);
  assert.match(widget, /retainInHistory = !reply\.toolUsed/);
  assert.doesNotMatch(storage, /action\.kind === "tool"/);
});

test("published knowledge can expire, require review and supersede an older managed source", async () => {
  const service = await text("server/src/modules/chatbot/admin/chatbot-admin.service.ts");
  const managed = await text("server/src/modules/chatbot/knowledge/managed-knowledge.ts");
  assert.match(service, /CHATBOT_KNOWLEDGE_EXPIRED/);
  assert.match(service, /CHATBOT_KNOWLEDGE_REVIEW_OVERDUE/);
  assert.match(service, /chatbot\.knowledge_superseded/);
  assert.match(managed, /validFrom: \{ lte: now \}/);
  assert.match(managed, /reviewDueAt: \{ gte: now \}/);
});
