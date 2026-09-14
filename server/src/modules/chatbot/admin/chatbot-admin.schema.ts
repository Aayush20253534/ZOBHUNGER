import { z } from "zod";
import { ChatbotKnowledgeStatus, ChatbotLeadStatus } from "../../../generated/prisma/client.js";
import { KNOWLEDGE_CATEGORIES } from "../knowledge/knowledge.types.js";
import { isPublicChatbotRoute } from "../public-route-policy.js";

const publicUrl = z.string().trim().min(1).max(240)
  .refine((value) => value.startsWith("/") && !value.startsWith("//") && !/[?#\s]/.test(value), "Use a canonical site-relative public path")
  .refine(isPublicChatbotRoute, "Knowledge can only link to public chatbot routes");
const listText = z.array(z.string().trim().min(2).max(100)).max(30).default([]);
const optionalDate = z.preprocess(
  (value) => value === "" ? null : value,
  z.coerce.date().nullable().optional(),
);
const optionalShortText = z.preprocess(
  (value) => value === "" ? null : value,
  z.string().trim().max(120).nullable().optional(),
);

export const chatbotAdminListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  query: z.string().trim().max(120).optional(),
  status: z.nativeEnum(ChatbotKnowledgeStatus).optional(),
  category: z.enum(KNOWLEDGE_CATEGORIES).optional(),
}).strict();

export const chatbotKnowledgeCreateSchema = z.object({
  slug: z.string().trim().min(3).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(3).max(160),
  category: z.enum(KNOWLEDGE_CATEGORIES),
  url: publicUrl,
  description: z.string().trim().min(10).max(320).optional().or(z.literal("").transform(() => undefined)),
  keywords: listText,
  aliases: listText,
  body: z.string().trim().min(20).max(60_000),
  validFrom: optionalDate,
  validUntil: optionalDate,
  reviewDueAt: optionalDate,
  sourceVersion: z.string().trim().min(1).max(80).default("1"),
  ownerDepartment: optionalShortText,
  supersedesDocumentId: optionalShortText,
}).strict().refine((value) => !value.validFrom || !value.validUntil || value.validFrom <= value.validUntil, { message: "validUntil must be on or after validFrom", path: ["validUntil"] });

export const chatbotKnowledgeUpdateSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  category: z.enum(KNOWLEDGE_CATEGORIES).optional(),
  url: publicUrl.optional(),
  description: z.string().trim().min(10).max(320).optional().or(z.literal("").transform(() => undefined)),
  keywords: z.array(z.string().trim().min(2).max(100)).max(30).optional(),
  aliases: z.array(z.string().trim().min(2).max(100)).max(30).optional(),
  body: z.string().trim().min(20).max(60_000).optional(),
  validFrom: optionalDate, validUntil: optionalDate, reviewDueAt: optionalDate,
  sourceVersion: z.string().trim().min(1).max(80).optional(), ownerDepartment: optionalShortText, supersedesDocumentId: optionalShortText,
  expectedRevision: z.number().int().min(0),
}).strict().refine((value) => !value.validFrom || !value.validUntil || value.validFrom <= value.validUntil, { message: "validUntil must be on or after validFrom", path: ["validUntil"] });

export const chatbotKnowledgeStatusSchema = z.object({
  status: z.enum([ChatbotKnowledgeStatus.PUBLISHED, ChatbotKnowledgeStatus.ARCHIVED, ChatbotKnowledgeStatus.DRAFT]),
  expectedRevision: z.number().int().min(0),
}).strict();

export const chatbotLeadListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  query: z.string().trim().max(120).optional(),
  status: z.nativeEnum(ChatbotLeadStatus).optional(),
  audience: z.enum(["JOB_SEEKER", "BUSINESS", "VENDOR_PARTNER", "GENERAL"]).optional(),
}).strict();

export const chatbotLeadStatusSchema = z.object({ status: z.nativeEnum(ChatbotLeadStatus) }).strict();
export const chatbotAnalyticsSchema = z.object({ days: z.coerce.number().int().min(1).max(180).default(30) }).strict();
export const chatbotEntityParamsSchema = z.object({ id: z.string().trim().min(1).max(80) }).strict();

export type ChatbotAdminListInput = z.infer<typeof chatbotAdminListSchema>;
export type ChatbotKnowledgeCreateInput = z.infer<typeof chatbotKnowledgeCreateSchema>;
export type ChatbotKnowledgeUpdateInput = z.infer<typeof chatbotKnowledgeUpdateSchema>;
export type ChatbotKnowledgeStatusInput = z.infer<typeof chatbotKnowledgeStatusSchema>;
export type ChatbotLeadListInput = z.infer<typeof chatbotLeadListSchema>;
export type ChatbotAnalyticsInput = z.infer<typeof chatbotAnalyticsSchema>;
