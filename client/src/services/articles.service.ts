import { cache } from "react";
import { getDataAdapter } from "@/services/adapters";
import type { ArticleFilters } from "@/types/article.types";
import type { DataRequestOptions } from "@/types/data.types";

export function getArticles(
  filters?: ArticleFilters,
  options?: DataRequestOptions,
) {
  return getDataAdapter().listArticles(filters, options);
}
export function getArticleBySlug(slug: string, options?: DataRequestOptions) {
  return getDataAdapter().getArticle(slug, options);
}
// Share the read between page content and metadata during one server render.
export const getArticleForPage = cache(getArticleBySlug);
