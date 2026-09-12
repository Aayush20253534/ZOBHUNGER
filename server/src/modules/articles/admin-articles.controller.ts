import type { Request, RequestHandler, Response } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { archiveAdminArticle, createAdminArticle, getAdminArticle, listAdminArticles, publishAdminArticle, restoreAdminArticle, unpublishAdminArticle, updateAdminArticle } from "./admin-articles.service.js";
import type { AdminArticleListQuery, ArticleRevisionActionInput, CreateAdminArticleInput, PublishAdminArticleInput, UpdateAdminArticleInput } from "./articles.schema.js";

function actorId(res: Response) { return (res.locals.authUser as { id: string }).id; }
function audit(req: Request) { return { ipAddress: req.ip, userAgent: req.get("user-agent")?.slice(0, 500) }; }

export const listAdminArticlesController: RequestHandler = async (_req, res) => res.json(apiSuccessResponse("Article workspace retrieved", await listAdminArticles(res.locals.validated.query as AdminArticleListQuery)));
export const getAdminArticleController: RequestHandler = async (_req, res) => res.json(apiSuccessResponse("Article retrieved", await getAdminArticle(res.locals.validated.params.id)));
export const createAdminArticleController: RequestHandler = async (req, res) => res.status(201).json(apiSuccessResponse("Draft article created", await createAdminArticle(res.locals.validated.body as CreateAdminArticleInput, actorId(res), audit(req))));
export const updateAdminArticleController: RequestHandler = async (req, res) => res.json(apiSuccessResponse("Article saved", await updateAdminArticle(res.locals.validated.params.id, res.locals.validated.body as UpdateAdminArticleInput, actorId(res), audit(req))));
export const publishAdminArticleController: RequestHandler = async (req, res) => res.json(apiSuccessResponse("Article publication updated", await publishAdminArticle(res.locals.validated.params.id, res.locals.validated.body as PublishAdminArticleInput, actorId(res), audit(req))));
export const unpublishAdminArticleController: RequestHandler = async (req, res) => res.json(apiSuccessResponse("Article returned to draft", await unpublishAdminArticle(res.locals.validated.params.id, res.locals.validated.body as ArticleRevisionActionInput, actorId(res), audit(req))));
export const archiveAdminArticleController: RequestHandler = async (req, res) => res.json(apiSuccessResponse("Article archived", await archiveAdminArticle(res.locals.validated.params.id, res.locals.validated.body as ArticleRevisionActionInput, actorId(res), audit(req))));
export const restoreAdminArticleController: RequestHandler = async (req, res) => res.json(apiSuccessResponse("Article restored as draft", await restoreAdminArticle(res.locals.validated.params.id, res.locals.validated.body as ArticleRevisionActionInput, actorId(res), audit(req))));
