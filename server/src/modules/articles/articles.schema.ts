import { z } from "zod";

export const listArticlesQuerySchema = z.object({
  query: z.string().trim().min(1).max(160).optional(),
  category: z.string().trim().min(1).max(120).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(6),
});

export const articleSlugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(180),
});

export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>;
export type ArticleSlugParams = z.infer<typeof articleSlugParamsSchema>;
