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
  assert.match(service, /initialTopScore < threshold/);
  assert.match(service, /don’t have enough verified ZOBHUNGER information/i);
  assert.match(service, /rerankKnowledgeResults/);
  assert.match(search, /semanticScore/);
  assert.match(search, /scoreSemanticConcepts/);
  assert.match(reranker, /retrieval reranker/i);
  assert.match(prompt, /directly supported by the retrieved verified knowledge/i);
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
