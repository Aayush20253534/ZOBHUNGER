import { z } from "zod";

export const articleCategories = [
  "Hiring Trends",
  "Workforce Management",
  "Sales Hiring",
  "Gig Economy",
  "Retail Execution",
  "Trade Marketing",
  "Industry Insights",
] as const;

const httpsUrlSchema = z.string().trim().url().max(2048).refine(value => new URL(value).protocol === "https:", "Use an HTTPS URL");
const slugSchema = z.string().trim().toLowerCase().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens");
const sectionIdSchema = z.string().trim().toLowerCase().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens");

export const articleImageSchema = z.object({
  url: httpsUrlSchema,
  alt: z.string().trim().min(3).max(180),
  caption: z.string().trim().max(240).optional(),
});

export const articleSectionSchema = z.object({
  id: sectionIdSchema,
  heading: z.string().trim().min(3).max(180),
  paragraphs: z.array(z.string().trim().min(1).max(5000)).max(30).default([]),
  points: z.array(z.string().trim().min(1).max(600)).max(30).optional(),
  quotes: z.array(z.string().trim().min(3).max(1200)).max(10).optional(),
  images: z.array(articleImageSchema).max(8).optional(),
});

export const listArticlesQuerySchema = z.object({
  query: z.string().trim().min(1).max(160).optional(),
  category: z.string().trim().min(1).max(120).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(6),
});

export const articleSlugParamsSchema = z.object({ slug: slugSchema });
export const adminArticleParamsSchema = z.object({ id: z.string().trim().min(1).max(80) });

export const adminArticleListQuerySchema = z.object({
  query: z.string().trim().min(1).max(160).optional(),
  category: z.enum(articleCategories).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

const articleEditableFields = {
  title: z.string().trim().min(1).max(180),
  slug: slugSchema,
  excerpt: z.string().trim().max(420),
  category: z.enum(articleCategories),
  takeaway: z.string().trim().max(900),
  sections: z.array(articleSectionSchema).max(30),
  authorName: z.string().trim().max(120).nullable(),
  tags: z.array(z.string().trim().min(1).max(60)).max(20),
  coverImageUrl: httpsUrlSchema.nullable(),
  seoTitle: z.string().trim().max(70).nullable(),
  seoDescription: z.string().trim().max(170).nullable(),
  canonicalUrl: httpsUrlSchema.nullable(),
  ogImageUrl: httpsUrlSchema.nullable(),
};

export const createAdminArticleSchema = z.object({
  title: articleEditableFields.title,
  slug: articleEditableFields.slug.optional(),
  category: articleEditableFields.category.default("Industry Insights"),
});

export const updateAdminArticleSchema = z.object({
  ...articleEditableFields,
  expectedRevision: z.number().int().min(0),
}).partial().required({ expectedRevision: true }).strict();

export const articleRevisionActionSchema = z.object({ expectedRevision: z.number().int().min(0) }).strict();
export const publishAdminArticleSchema = articleRevisionActionSchema.extend({
  publishAt: z.string().datetime({ offset: true }).optional(),
}).strict();

export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>;
export type ArticleSlugParams = z.infer<typeof articleSlugParamsSchema>;
export type AdminArticleListQuery = z.infer<typeof adminArticleListQuerySchema>;
export type CreateAdminArticleInput = z.infer<typeof createAdminArticleSchema>;
export type UpdateAdminArticleInput = z.infer<typeof updateAdminArticleSchema>;
export type PublishAdminArticleInput = z.infer<typeof publishAdminArticleSchema>;
export type ArticleRevisionActionInput = z.infer<typeof articleRevisionActionSchema>;
export type ArticleSectionInput = z.infer<typeof articleSectionSchema>;
