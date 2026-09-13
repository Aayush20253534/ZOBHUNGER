import { ChatbotAudience, ChatbotMessageRole } from "../../generated/prisma/client.js";
import { prisma } from "../../config/db.js";
import type { ChatbotHistoryMessage, ChatbotMessageResult } from "./chatbot.types.js";

const PUBLIC_ID = /^chat_[a-zA-Z0-9_-]{8,120}$/;

export async function loadConversationMemory(publicId: string | undefined, maxMessages: number, clientFingerprint?: string) {
  if (!publicId || !PUBLIC_ID.test(publicId)) return { conversation: null, history: [] as ChatbotHistoryMessage[] };
  const conversation = await prisma.chatbotConversation.findUnique({
    where: { publicId },
    select: {
      id: true, publicId: true, clientFingerprint: true, audience: true, summary: true, currentPage: true,
      messages: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: maxMessages,
        select: { role: true, content: true },
      },
    },
  });
  if (!conversation) return { conversation: null, history: [] as ChatbotHistoryMessage[] };
  if (conversation.clientFingerprint && clientFingerprint && conversation.clientFingerprint !== clientFingerprint) {
    return { conversation: null, history: [] as ChatbotHistoryMessage[] };
  }
  const history = [...conversation.messages].reverse().map((message) => ({
    role: message.role === ChatbotMessageRole.USER ? "user" as const : "assistant" as const,
    content: message.content,
  }));
  return { conversation, history };
}

export async function persistConversationTurn(input: {
  publicId: string;
  clientFingerprint?: string;
  audience: ChatbotAudience;
  currentPage?: string;
  userMessage: string;
  result: ChatbotMessageResult;
  retrievalScore?: number;
  latencyMs: number;
}) {
  if (!PUBLIC_ID.test(input.publicId)) return;
  await prisma.$transaction(async (tx) => {
    const existing = await tx.chatbotConversation.findUnique({
      where: { publicId: input.publicId },
      select: { id: true, clientFingerprint: true },
    });
    if (existing?.clientFingerprint && input.clientFingerprint && existing.clientFingerprint !== input.clientFingerprint) return;
    const conversation = existing
      ? await tx.chatbotConversation.update({
          where: { id: existing.id },
          data: { audience: input.audience, currentPage: input.currentPage, lastMessageAt: new Date(), ...(input.clientFingerprint && !existing.clientFingerprint ? { clientFingerprint: input.clientFingerprint } : {}) },
          select: { id: true },
        })
      : await tx.chatbotConversation.create({
          data: {
            publicId: input.publicId,
            clientFingerprint: input.clientFingerprint,
            audience: input.audience,
            currentPage: input.currentPage,
            lastMessageAt: new Date(),
          },
          select: { id: true },
        });
    await tx.chatbotMessage.createMany({ data: [
      { conversationId: conversation.id, role: ChatbotMessageRole.USER, content: input.userMessage },
      {
        conversationId: conversation.id,
        role: ChatbotMessageRole.ASSISTANT,
        content: input.result.answer,
        grounded: input.result.grounded,
        unanswered: input.result.unanswered,
        sourceUrls: input.result.sources.map((source) => source.url),
        retrievalScore: input.retrievalScore,
        latencyMs: Math.round(input.latencyMs),
      },
    ] });
  });
}
