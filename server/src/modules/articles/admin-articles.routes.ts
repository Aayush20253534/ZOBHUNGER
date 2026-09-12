import { Router } from "express";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { archiveAdminArticleController, createAdminArticleController, getAdminArticleController, listAdminArticlesController, publishAdminArticleController, restoreAdminArticleController, unpublishAdminArticleController, updateAdminArticleController } from "./admin-articles.controller.js";
import { adminArticleListQuerySchema, adminArticleParamsSchema, articleRevisionActionSchema, createAdminArticleSchema, publishAdminArticleSchema, updateAdminArticleSchema } from "./articles.schema.js";

/** Mounted after administrator auth, MFA and BLOGS_MANAGE permission checks. */
export const adminArticlesRouter = Router();
adminArticlesRouter.get("/", validate({ query: adminArticleListQuerySchema }), listAdminArticlesController);
adminArticlesRouter.post("/", portalWrite, validate({ body: createAdminArticleSchema }), createAdminArticleController);
adminArticlesRouter.get("/:id", validate({ params: adminArticleParamsSchema }), getAdminArticleController);
adminArticlesRouter.patch("/:id", portalWrite, validate({ params: adminArticleParamsSchema, body: updateAdminArticleSchema }), updateAdminArticleController);
adminArticlesRouter.post("/:id/publish", portalWrite, validate({ params: adminArticleParamsSchema, body: publishAdminArticleSchema }), publishAdminArticleController);
adminArticlesRouter.post("/:id/unpublish", portalWrite, validate({ params: adminArticleParamsSchema, body: articleRevisionActionSchema }), unpublishAdminArticleController);
adminArticlesRouter.post("/:id/archive", portalWrite, validate({ params: adminArticleParamsSchema, body: articleRevisionActionSchema }), archiveAdminArticleController);
adminArticlesRouter.post("/:id/restore", portalWrite, validate({ params: adminArticleParamsSchema, body: articleRevisionActionSchema }), restoreAdminArticleController);
