import { z } from "zod";

const historyMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4_000),
}).strict();

const publicPagePathSchema = z.string().trim().min(1).max(300)
  .refine((value) => value.startsWith("/"), "currentPage must be a site-relative path")
  .refine((value) => !value.startsWith("//"), "currentPage must not be a protocol-relative URL")
  .refine((value) => !/\s/.test(value), "currentPage must not contain whitespace")
  .refine((value) => !/[?#]/.test(value), "currentPage must be a canonical path without query strings or fragments")
  .refine((value) => value !== "/admin" && !value.startsWith("/admin/"), "admin routes are not valid chatbot context")
  .refine((value) => value !== "/business" && !value.startsWith("/business/"), "private business routes are not valid chatbot context")
  .refine((value) => value !== "/worker" && !value.startsWith("/worker/"), "private worker routes are not valid chatbot context")
  .refine((value) => value !== "/employee-joining" && !value.startsWith("/employee-joining/"), "employee joining routes are not valid chatbot context");

export const chatbotMessageSchema = z.object({
  message: z.string().trim().min(1).max(2_000),
  history: z.array(historyMessageSchema).max(10).default([]),
  currentPage: publicPagePathSchema.optional(),
}).strict();

export type ChatbotMessageRequest = z.infer<typeof chatbotMessageSchema>;
