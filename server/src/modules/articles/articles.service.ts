import { HttpError } from "../../utils/http-error.js";
import type { ListArticlesQuery } from "./articles.schema.js";
import {
  findPublishedArticleBySlug,
  findPublishedArticles,
} from "./articles.repository.js";

export async function listPublishedArticles(filters: ListArticlesQuery) {
  const { items, total } = await findPublishedArticles(filters);
  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize),
  };
}

export async function getPublishedArticle(slug: string) {
  const article = await findPublishedArticleBySlug(slug);
  if (!article) {
    throw new HttpError(404, "Article not found", { code: "ARTICLE_NOT_FOUND" });
  }
  return article;
}
