import type { ArticleFilters } from "@/types/article.types";

export const ARTICLES_PAGE_SIZE = 6;
export type ArticleSearchParams = Record<string, string | string[] | undefined>;
const textValue = (value: string | string[] | undefined) =>
  typeof value === "string" ? value.trim().slice(0, 120) : "";

export function parseArticleFilters(
  query: ArticleSearchParams = {},
): ArticleFilters {
  const raw =
    typeof query.page === "string" && /^\d+$/.test(query.page)
      ? Number(query.page)
      : 1;
  return {
    query: textValue(query.query),
    category: textValue(query.category),
    page: Number.isSafeInteger(raw) && raw > 0 ? Math.min(raw, 100000) : 1,
    pageSize: ARTICLES_PAGE_SIZE,
  };
}

export function articlesHref(filters: ArticleFilters = {}) {
  const params = new URLSearchParams();
  for (const key of ["query", "category"] as const) {
    const value = filters[key]?.trim().slice(0, 120);
    if (value) params.set(key, value);
  }
  if (filters.page && Number.isSafeInteger(filters.page) && filters.page > 1)
    params.set("page", String(Math.min(filters.page, 100000)));
  return params.size ? `/blogs?${params}` : "/blogs";
}
