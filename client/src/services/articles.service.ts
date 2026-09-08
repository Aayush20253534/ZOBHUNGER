import { cache } from "react";
import { mockArticles } from "@/mocks/articles";
import { getArticleVisualText } from "@/data/article-visual-stories";
import type {
  Article,
  ArticleFilters,
  ArticleList,
  ArticleSummary,
} from "@/types/article.types";
import type { DataRequestOptions } from "@/types/data.types";

function positiveInteger(
  value: number | undefined,
  fallback: number,
  maximum: number,
) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(1, Math.trunc(value)))
    : fallback;
}

function normalise(value?: string) {
  return value?.trim().toLocaleLowerCase("en-IN") ?? "";
}

function toSummary(article: Article): ArticleSummary {
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    readingMinutes: article.readingMinutes,
    isPublished: article.isPublished,
    isSample: article.isSample,
  };
}

/**
 * Public editorial content is intentionally local/static.
 * This keeps article navigation instant and avoids coupling marketing pages to
 * API cold starts. Jobs/forms continue to use the configured data adapter.
 */
export async function getArticles(
  filters: ArticleFilters = {},
  options?: DataRequestOptions,
): Promise<ArticleList> {
  if (options?.scenario === "empty") {
    return { items: [], total: 0, page: 1, pageSize: 6, totalPages: 0 };
  }

  const query = normalise(filters.query);
  const category = normalise(filters.category);
  const articles = mockArticles.filter(
    (item) =>
      item.isPublished &&
      (!query ||
        normalise(
          `${item.title} ${item.excerpt} ${item.category} ${item.takeaway} ${getArticleVisualText(item.slug)} ${item.sections
            .map((section) => `${section.heading} ${section.paragraphs.join(" ")} ${(section.points ?? []).join(" ")}`)
            .join(" ")}`,
        ).includes(query)) &&
      (!category || normalise(item.category) === category),
  );

  const pageSize = positiveInteger(filters.pageSize, 6, 100);
  const totalPages = Math.ceil(articles.length / pageSize);
  const page = Math.min(
    positiveInteger(filters.page, 1, 100000),
    Math.max(1, totalPages),
  );

  return {
    items: articles
      .slice((page - 1) * pageSize, page * pageSize)
      .map(toSummary),
    total: articles.length,
    page,
    pageSize,
    totalPages,
  };
}

export async function getArticleBySlug(
  slug: string,
  options?: DataRequestOptions,
): Promise<Article | null> {
  if (options?.scenario === "empty") return null;
  return mockArticles.find((item) => item.slug === slug && item.isPublished) ?? null;
}

export const getArticleForPage = cache(getArticleBySlug);
