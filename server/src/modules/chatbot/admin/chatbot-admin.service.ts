import { ChatbotKnowledgeStatus, type Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/db.js";
import { HttpError } from "../../../utils/http-error.js";
import { refreshChatbotRuntime } from "../chatbot.runtime.js";
import { knowledgeMetadataSchema } from "../knowledge/knowledge.schema.js";
import type {
  ChatbotAdminListInput, ChatbotAnalyticsInput, ChatbotKnowledgeCreateInput,
  ChatbotKnowledgeStatusInput, ChatbotKnowledgeUpdateInput, ChatbotLeadListInput,
} from "./chatbot-admin.schema.js";

const PAGE_SIZE = 20;

function knowledgeWhere(input: ChatbotAdminListInput): Prisma.ChatbotKnowledgeDocumentWhereInput {
  return {
    ...(input.status ? { status: input.status } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.query ? { OR: [
      { title: { contains: input.query, mode: "insensitive" } },
      { slug: { contains: input.query, mode: "insensitive" } },
      { body: { contains: input.query, mode: "insensitive" } },
    ] } : {}),
  };
}

const knowledgeSelect = {
  id: true, slug: true, title: true, category: true, url: true, description: true, keywords: true, aliases: true,
  body: true, status: true, revision: true, verifiedAt: true, publishedAt: true, validFrom: true, validUntil: true, reviewDueAt: true,
  sourceVersion: true, ownerDepartment: true, supersedesDocumentId: true, createdAt: true, updatedAt: true,
  createdBy: { select: { id: true, email: true } },
  updatedBy: { select: { id: true, email: true } },
  verifiedBy: { select: { id: true, email: true } },
} satisfies Prisma.ChatbotKnowledgeDocumentSelect;

export async function listChatbotKnowledge(input: ChatbotAdminListInput) {
  const where = knowledgeWhere(input);
  const [items, total] = await prisma.$transaction([
    prisma.chatbotKnowledgeDocument.findMany({ where, select: knowledgeSelect, take: PAGE_SIZE, skip: (input.page - 1) * PAGE_SIZE, orderBy: [{ updatedAt: "desc" }, { id: "desc" }] }),
    prisma.chatbotKnowledgeDocument.count({ where }),
  ]);
  return { items, total, page: input.page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

function validatePublishable(input: { slug: string; title: string; category: string; url: string; description: string | null; keywords: string[]; aliases: string[]; body: string }) {
  const parsed = knowledgeMetadataSchema.safeParse({
    id: `managed-${input.slug}`,
    title: input.title,
    category: input.category,
    url: input.url,
    description: input.description ?? undefined,
    keywords: input.keywords,
    aliases: input.aliases,
    status: "published",
  });
  if (!parsed.success || input.body.trim().length < 20) {
    throw new HttpError(400, "Knowledge document is not ready to publish", {
      code: "CHATBOT_KNOWLEDGE_INVALID",
      details: parsed.success ? { body: "Add verified source content before publishing" } : parsed.error.flatten(),
    });
  }
}

export async function createChatbotKnowledge(actorId: string, input: ChatbotKnowledgeCreateInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      const item = await tx.chatbotKnowledgeDocument.create({ data: {
        ...input, description: input.description ?? null, ownerDepartment: input.ownerDepartment ?? null, supersedesDocumentId: input.supersedesDocumentId ?? null,
        status: ChatbotKnowledgeStatus.DRAFT, createdByUserId: actorId, updatedByUserId: actorId,
      }, select: knowledgeSelect });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "chatbot.knowledge_created", entityType: "ChatbotKnowledgeDocument", entityId: item.id, metadata: { slug: item.slug } } });
      return item;
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      throw new HttpError(409, "A knowledge document already uses that slug", { code: "CHATBOT_KNOWLEDGE_SLUG_EXISTS" });
    }
    throw error;
  }
}

export async function updateChatbotKnowledge(actorId: string, id: string, input: ChatbotKnowledgeUpdateInput) {
  const { expectedRevision, ...data } = input;
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.chatbotKnowledgeDocument.findUnique({ where: { id }, select: { status: true } });
    if (!current) throw new HttpError(404, "Knowledge document not found", { code: "CHATBOT_KNOWLEDGE_NOT_FOUND" });
    const changed = await tx.chatbotKnowledgeDocument.updateMany({ where: { id, revision: expectedRevision }, data: {
      ...data, updatedByUserId: actorId, revision: { increment: 1 },
      ...(current.status === ChatbotKnowledgeStatus.PUBLISHED ? { status: ChatbotKnowledgeStatus.DRAFT, verifiedAt: null, verifiedByUserId: null, publishedAt: null } : {}),
    } });
    if (changed.count !== 1) throw new HttpError(409, "This knowledge document changed. Refresh before saving.", { code: "CHATBOT_KNOWLEDGE_CHANGED" });
    const item = await tx.chatbotKnowledgeDocument.findUniqueOrThrow({ where: { id }, select: knowledgeSelect });
    await tx.auditLog.create({ data: { actorUserId: actorId, action: "chatbot.knowledge_updated", entityType: "ChatbotKnowledgeDocument", entityId: id, metadata: { revision: item.revision } } });
    return { item, refresh: current.status === ChatbotKnowledgeStatus.PUBLISHED };
  });
  if (result.refresh) refreshChatbotRuntime();
  return result.item;
}

export async function changeChatbotKnowledgeStatus(actorId: string, id: string, input: ChatbotKnowledgeStatusInput) {
  const item = await prisma.$transaction(async (tx) => {
    const current = await tx.chatbotKnowledgeDocument.findUnique({ where: { id }, select: { slug: true, title: true, category: true, url: true, description: true, keywords: true, aliases: true, body: true, validFrom: true, validUntil: true, reviewDueAt: true, supersedesDocumentId: true } });
    if (!current) throw new HttpError(404, "Knowledge document not found", { code: "CHATBOT_KNOWLEDGE_NOT_FOUND" });
    if (input.status === ChatbotKnowledgeStatus.PUBLISHED) validatePublishable(current);
    const now = new Date();
    if (input.status === ChatbotKnowledgeStatus.PUBLISHED) {
      if (current.validFrom && current.validUntil && current.validFrom > current.validUntil) throw new HttpError(400, "Knowledge validity window is invalid", { code: "CHATBOT_KNOWLEDGE_FRESHNESS_INVALID" });
      if (current.validUntil && current.validUntil < now) throw new HttpError(400, "Expired knowledge cannot be published", { code: "CHATBOT_KNOWLEDGE_EXPIRED" });
      if (current.reviewDueAt && current.reviewDueAt < now) throw new HttpError(400, "Review this knowledge before publishing it", { code: "CHATBOT_KNOWLEDGE_REVIEW_OVERDUE" });
    }
    const changed = await tx.chatbotKnowledgeDocument.updateMany({ where: { id, revision: input.expectedRevision }, data: {
      status: input.status,
      updatedByUserId: actorId,
      revision: { increment: 1 },
      ...(input.status === ChatbotKnowledgeStatus.PUBLISHED ? { verifiedByUserId: actorId, verifiedAt: now, publishedAt: now } : { verifiedByUserId: null, verifiedAt: null, publishedAt: null }),
    } });
    if (changed.count !== 1) throw new HttpError(409, "This knowledge document changed. Refresh before changing status.", { code: "CHATBOT_KNOWLEDGE_CHANGED" });
    if (input.status === ChatbotKnowledgeStatus.PUBLISHED && current.supersedesDocumentId) {
      if (current.supersedesDocumentId === id) throw new HttpError(400, "A knowledge document cannot supersede itself", { code: "CHATBOT_KNOWLEDGE_SUPERSESSION_INVALID" });
      const superseded = await tx.chatbotKnowledgeDocument.updateMany({
        where: { id: current.supersedesDocumentId, status: ChatbotKnowledgeStatus.PUBLISHED },
        data: {
          status: ChatbotKnowledgeStatus.ARCHIVED, updatedByUserId: actorId, revision: { increment: 1 },
          verifiedByUserId: null, verifiedAt: null, publishedAt: null,
        },
      });
      if (superseded.count) {
        await tx.auditLog.create({ data: { actorUserId: actorId, action: "chatbot.knowledge_superseded", entityType: "ChatbotKnowledgeDocument", entityId: current.supersedesDocumentId, metadata: { supersededBy: id } } });
      }
    }
    const updated = await tx.chatbotKnowledgeDocument.findUniqueOrThrow({ where: { id }, select: knowledgeSelect });
    await tx.auditLog.create({ data: { actorUserId: actorId, action: "chatbot.knowledge_status_changed", entityType: "ChatbotKnowledgeDocument", entityId: id, metadata: { status: updated.status, revision: updated.revision } } });
    return updated;
  });
  refreshChatbotRuntime();
  return item;
}

function leadWhere(input: ChatbotLeadListInput): Prisma.ChatbotLeadWhereInput {
  return {
    ...(input.status ? { status: input.status } : {}),
    ...(input.audience ? { audience: input.audience } : {}),
    ...(input.query ? { OR: [
      { name: { contains: input.query, mode: "insensitive" } }, { email: { contains: input.query, mode: "insensitive" } },
      { phone: { contains: input.query, mode: "insensitive" } }, { companyName: { contains: input.query, mode: "insensitive" } },
      { requirement: { contains: input.query, mode: "insensitive" } },
    ] } : {}),
  };
}

export async function listChatbotLeads(input: ChatbotLeadListInput) {
  const where = leadWhere(input);
  const [items, total] = await prisma.$transaction([
    prisma.chatbotLead.findMany({ where, take: PAGE_SIZE, skip: (input.page - 1) * PAGE_SIZE, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
    prisma.chatbotLead.count({ where }),
  ]);
  return { items, total, page: input.page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function updateChatbotLeadStatus(actorId: string, id: string, status: "NEW" | "CONTACTED" | "QUALIFIED" | "CLOSED") {
  return prisma.$transaction(async (tx) => {
    const changed = await tx.chatbotLead.updateMany({ where: { id }, data: { status } });
    if (changed.count !== 1) throw new HttpError(404, "AI assistant lead not found", { code: "CHATBOT_LEAD_NOT_FOUND" });
    const item = await tx.chatbotLead.findUniqueOrThrow({ where: { id } });
    await tx.auditLog.create({ data: { actorUserId: actorId, action: "chatbot.lead_status_changed", entityType: "ChatbotLead", entityId: id, metadata: { status } } });
    return item;
  });
}

export async function chatbotAnalytics(input: ChatbotAnalyticsInput) {
  const since = new Date(Date.now() - input.days * 86_400_000);
  const audienceValues = ["UNKNOWN", "JOB_SEEKER", "BUSINESS", "VENDOR_PARTNER", "GENERAL"] as const;
  const leadAudienceValues = ["JOB_SEEKER", "BUSINESS", "VENDOR_PARTNER", "GENERAL", "UNKNOWN"] as const;
  const knowledgeStatusValues = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

  const [conversations, questions, assistantMessages, leads, unansweredConversations] = await prisma.$transaction([
    prisma.chatbotConversation.count({ where: { createdAt: { gte: since } } }),
    prisma.chatbotMessage.count({ where: { role: "USER", createdAt: { gte: since } } }),
    prisma.chatbotMessage.findMany({ where: { role: "ASSISTANT", createdAt: { gte: since } }, select: { grounded: true, unanswered: true, latencyMs: true } }),
    prisma.chatbotLead.count({ where: { createdAt: { gte: since } } }),
    prisma.chatbotConversation.findMany({
      where: { messages: { some: { role: "ASSISTANT", unanswered: true, createdAt: { gte: since } } } },
      select: { messages: {
        where: { createdAt: { gte: since } },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { role: true, content: true, unanswered: true },
      } },
      take: 200,
      orderBy: { lastMessageAt: "desc" },
    }),
  ]);
  const [audienceCountValues, leadAudienceCountValues, knowledgeCountValues] = await Promise.all([
    prisma.$transaction(audienceValues.map((audience) => prisma.chatbotConversation.count({ where: { createdAt: { gte: since }, audience } }))),
    prisma.$transaction(leadAudienceValues.map((audience) => prisma.chatbotLead.count({ where: { createdAt: { gte: since }, audience } }))),
    prisma.$transaction(knowledgeStatusValues.map((status) => prisma.chatbotKnowledgeDocument.count({ where: { status } }))),
  ]);

  const unansweredMap = new Map<string, number>();
  for (const conversation of unansweredConversations) {
    let lastUserQuestion = "";
    for (const message of conversation.messages) {
      if (message.role === "USER") lastUserQuestion = message.content;
      else if (message.role === "ASSISTANT" && message.unanswered && lastUserQuestion) {
        const key = lastUserQuestion.trim().replace(/\s+/g, " ").slice(0, 300);
        if (key) unansweredMap.set(key, (unansweredMap.get(key) ?? 0) + 1);
      }
    }
  }

  const now = new Date();
  const [overdueReview, expiredKnowledge, expiringSoon] = await prisma.$transaction([
    prisma.chatbotKnowledgeDocument.count({ where: { status: "PUBLISHED", reviewDueAt: { lt: now } } }),
    prisma.chatbotKnowledgeDocument.count({ where: { status: "PUBLISHED", validUntil: { lt: now } } }),
    prisma.chatbotKnowledgeDocument.count({ where: { status: "PUBLISHED", validUntil: { gte: now, lte: new Date(now.getTime() + 30 * 86_400_000) } } }),
  ]);

  const avgLatency = assistantMessages.length
    ? Math.round(assistantMessages.reduce((sum, row) => sum + (row.latencyMs ?? 0), 0) / assistantMessages.length)
    : 0;
  const grounded = assistantMessages.filter((row) => row.grounded).length;
  const unanswered = assistantMessages.filter((row) => row.unanswered).length;

  const audience = Object.fromEntries(audienceValues.map((value, index) => [value, audienceCountValues[index] ?? 0])) as Record<(typeof audienceValues)[number], number>;
  const leadAudience = Object.fromEntries(leadAudienceValues.map((value, index) => [value, leadAudienceCountValues[index] ?? 0])) as Record<(typeof leadAudienceValues)[number], number>;
  const knowledge = Object.fromEntries(knowledgeStatusValues.map((value, index) => [value, knowledgeCountValues[index] ?? 0])) as Record<(typeof knowledgeStatusValues)[number], number>;

  return {
    days: input.days,
    totals: { conversations, questions, answers: assistantMessages.length, leads, unanswered, grounded, averageLatencyMs: avgLatency },
    rates: {
      grounded: assistantMessages.length ? grounded / assistantMessages.length : 0,
      unanswered: assistantMessages.length ? unanswered / assistantMessages.length : 0,
      leadConversion: conversations ? leads / conversations : 0,
    },
    audience,
    leadAudience,
    knowledge,
    knowledgeFreshness: { overdueReview, expired: expiredKnowledge, expiringSoon },
    topUnanswered: [...unansweredMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([question, count]) => ({ question, count })),
  };
}
