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

export const chatbotMessageSchema = z.object({
  message: z.string().trim().min(1).max(2_000),
  history: z.array(historyMessageSchema).max(10).default([]),
  currentPage: publicPagePathSchema.optional(),
}).strict();

export type ChatbotMessageRequest = z.infer<typeof chatbotMessageSchema>;
