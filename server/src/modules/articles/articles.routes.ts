import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { getArticleController, listArticlesController } from "./articles.controller.js";
import { articleSlugParamsSchema, listArticlesQuerySchema } from "./articles.schema.js";

export const articlesRouter = Router();

articlesRouter.get(
  "/",
  validate({ query: listArticlesQuerySchema }),
  listArticlesController,
);

articlesRouter.get(
  "/:slug",
  validate({ params: articleSlugParamsSchema }),
  getArticleController,
);
