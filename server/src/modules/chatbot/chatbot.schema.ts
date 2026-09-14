import { z } from "zod";
import { isPublicChatbotRoute } from "./public-route-policy.js";

const historyMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4_000),
}).strict();

const publicPagePathSchema = z.string().trim().min(1).max(300)
  .refine((value) => value.startsWith("/"), "currentPage must be a site-relative path")
  .refine((value) => !value.startsWith("//"), "currentPage must not be a protocol-relative URL")
  .refine((value) => !/\s/.test(value), "currentPage must not contain whitespace")
  .refine((value) => !/[?#]/.test(value), "currentPage must be a canonical path without query strings or fragments")
  .refine(isPublicChatbotRoute, "private or authentication routes are not valid chatbot context");

const conversationIdSchema = z.string().trim().regex(/^chat_[a-zA-Z0-9_-]{8,120}$/, "invalid conversation id");

export const chatbotMessageSchema = z.object({
  message: z.string().trim().min(1).max(2_000),
  history: z.array(historyMessageSchema).max(10).default([]),
  currentPage: publicPagePathSchema.optional(),
  conversationId: conversationIdSchema.optional(),
}).strict();

export const chatbotLeadSchema = z.object({
  conversationId: conversationIdSchema.optional(),
  audience: z.enum(["JOB_SEEKER", "BUSINESS", "VENDOR_PARTNER", "GENERAL"]),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()).optional().or(z.literal("").transform(() => undefined)),
  phone: z.string().trim().min(7).max(24).optional().or(z.literal("").transform(() => undefined)),
  companyName: z.string().trim().max(160).optional().or(z.literal("").transform(() => undefined)),
  requirement: z.string().trim().min(5).max(1200),
  enquiryDetails: z.string().trim().max(3000).optional().or(z.literal("").transform(() => undefined)),
  sourcePath: publicPagePathSchema.optional(),
  handover: z.boolean().default(false),
}).strict().refine((value) => Boolean(value.email || value.phone), { message: "Provide an email address or phone number", path: ["email"] });


export const chatbotToolExecutionSchema = z.object({
  tool: z.enum(["business.save_requirement_draft"]),
  input: z.record(z.string(), z.unknown()),
  confirmed: z.literal(true),
}).strict();

export type ChatbotToolExecutionRequest = z.infer<typeof chatbotToolExecutionSchema>;

export type ChatbotLeadRequest = z.infer<typeof chatbotLeadSchema>;

export type ChatbotMessageRequest = z.infer<typeof chatbotMessageSchema>;
