import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import type { ArticleSlugParams, ListArticlesQuery } from "./articles.schema.js";
import { getPublishedArticle, listPublishedArticles } from "./articles.service.js";

export const listArticlesController: RequestHandler = async (_req, res) => {
  const data = await listPublishedArticles(
    res.locals.validated.query as ListArticlesQuery,
  );
  res.status(200).json(apiSuccessResponse("Articles retrieved", data));
};

export const getArticleController: RequestHandler = async (_req, res) => {
  const { slug } = res.locals.validated.params as ArticleSlugParams;
  const data = await getPublishedArticle(slug);
  res.status(200).json(apiSuccessResponse("Article retrieved", data));
};
