import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/db.js";
import type { ListArticlesQuery } from "./articles.schema.js";

export async function findPublishedArticles(filters: ListArticlesQuery) {
  const where: Prisma.ArticleWhereInput = { isPublished: true };

  if (filters.category) {
    where.category = { equals: filters.category, mode: "insensitive" };
  }

  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query, mode: "insensitive" } },
      { excerpt: { contains: filters.query, mode: "insensitive" } },
      { category: { contains: filters.query, mode: "insensitive" } },
      { takeaway: { contains: filters.query, mode: "insensitive" } },
    ];
  }

  const skip = (filters.page - 1) * filters.pageSize;
  const [items, total] = await prisma.$transaction([
    prisma.article.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: filters.pageSize,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        readingMinutes: true,
        isPublished: true,
        isSample: true,
      },
    }),
    prisma.article.count({ where }),
  ]);

  return { items, total };
}

export function findPublishedArticleBySlug(slug: string) {
  return prisma.article.findFirst({
    where: { slug, isPublished: true },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      readingMinutes: true,
      takeaway: true,
      sections: true,
      isPublished: true,
      isSample: true,
    },
  });
}
