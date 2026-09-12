import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/db.js";
import type { AdminArticleListQuery, ListArticlesQuery } from "./articles.schema.js";

const publicSelect = {
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  readingMinutes: true,
  takeaway: true,
  sections: true,
  authorName: true,
  tags: true,
  coverImageUrl: true,
  seoTitle: true,
  seoDescription: true,
  canonicalUrl: true,
  ogImageUrl: true,
  isPublished: true,
  isSample: true,
  publishedAt: true,
  updatedAt: true,
} satisfies Prisma.ArticleSelect;

export async function findPublishedArticles(filters: ListArticlesQuery) {
  const where: Prisma.ArticleWhereInput = {
    isPublished: true,
    archivedAt: null,
    publishedAt: { lte: new Date() },
  };

  if (filters.category) where.category = { equals: filters.category, mode: "insensitive" };
  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query, mode: "insensitive" } },
      { excerpt: { contains: filters.query, mode: "insensitive" } },
      { category: { contains: filters.query, mode: "insensitive" } },
      { takeaway: { contains: filters.query, mode: "insensitive" } },
      { tags: { has: filters.query } },
    ];
  }

  const skip = (filters.page - 1) * filters.pageSize;
  const [rows, total] = await prisma.$transaction([
    prisma.article.findMany({ where, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }], skip, take: filters.pageSize, select: publicSelect }),
    prisma.article.count({ where }),
  ]);

  return {
    items: rows.map(({ takeaway: _takeaway, sections: _sections, ...item }) => item),
    total,
  };
}

export function findPublishedArticleBySlug(slug: string) {
  return prisma.article.findFirst({
    where: { slug, isPublished: true, archivedAt: null, publishedAt: { lte: new Date() } },
    select: publicSelect,
  });
}

export function adminArticleWhere(filters: AdminArticleListQuery): Prisma.ArticleWhereInput {
  const where: Prisma.ArticleWhereInput = {};
  const now = new Date();
  if (filters.status === "ARCHIVED") where.archivedAt = { not: null };
  if (filters.status === "DRAFT") Object.assign(where, { archivedAt: null, isPublished: false });
  if (filters.status === "PUBLISHED") Object.assign(where, { archivedAt: null, isPublished: true, publishedAt: { lte: now } });
  if (filters.status === "SCHEDULED") Object.assign(where, { archivedAt: null, isPublished: true, publishedAt: { gt: now } });

  const draftFilters: Prisma.ArticleDraftWhereInput = {};
  if (filters.category) draftFilters.category = filters.category;
  if (filters.query) {
    draftFilters.OR = [
      { title: { contains: filters.query, mode: "insensitive" } },
      { slug: { contains: filters.query, mode: "insensitive" } },
      { excerpt: { contains: filters.query, mode: "insensitive" } },
      { authorName: { contains: filters.query, mode: "insensitive" } },
      { tags: { has: filters.query } },
    ];
  }
  if (Object.keys(draftFilters).length) where.draft = { is: draftFilters };
  return where;
}
