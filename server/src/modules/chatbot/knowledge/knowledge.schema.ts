import { z } from "zod";
import { isPublicChatbotRoute } from "../public-route-policy.js";
import { KNOWLEDGE_CATEGORIES } from "./knowledge.types.js";

const knowledgePathSchema = z
  .string()
  .trim()
  .min(1)
  .max(240)
  .refine((value: string) => value.startsWith("/"), "url must start with /")
  .refine((value: string) => !value.startsWith("//"), "url must be a site-relative path")
  .refine((value: string) => !/\s/.test(value), "url must not contain whitespace")
  .refine((value: string) => !/[?#]/.test(value), "url must be a canonical path without query strings or fragments")
  .refine(isPublicChatbotRoute, "private or authentication routes cannot be indexed");

const keywordSchema = z.string().trim().min(2).max(80);

export const knowledgeMetadataSchema = z.object({
  id: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id must use lowercase kebab-case"),
  title: z.string().trim().min(3).max(160),
  category: z.enum(KNOWLEDGE_CATEGORIES),
  url: knowledgePathSchema,
  keywords: z.array(keywordSchema).min(1).max(30),
  status: z.enum(["draft", "published", "archived"]),
  description: z.string().trim().min(10).max(320).optional(),
  aliases: z.array(z.string().trim().min(2).max(100)).max(20).optional(),
  updatedAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "updatedAt must use YYYY-MM-DD")
    .optional(),
}).strict();

export type KnowledgeMetadataInput = z.input<typeof knowledgeMetadataSchema>;
