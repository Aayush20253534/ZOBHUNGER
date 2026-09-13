import { Router } from "express";
import { portalWrite } from "../../../middlewares/portal-write.middleware.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import {
  analyticsController, createKnowledgeController, knowledgeStatusController, leadStatusController,
  listKnowledgeController, listLeadsController, updateKnowledgeController,
} from "./chatbot-admin.controller.js";
import {
  chatbotAdminListSchema, chatbotAnalyticsSchema, chatbotEntityParamsSchema, chatbotKnowledgeCreateSchema,
  chatbotKnowledgeStatusSchema, chatbotKnowledgeUpdateSchema, chatbotLeadListSchema, chatbotLeadStatusSchema,
} from "./chatbot-admin.schema.js";

export const adminChatbotRouter = Router();
adminChatbotRouter.get("/analytics", validate({ query: chatbotAnalyticsSchema }), analyticsController);
adminChatbotRouter.get("/knowledge", validate({ query: chatbotAdminListSchema }), listKnowledgeController);
adminChatbotRouter.post("/knowledge", portalWrite, validate({ body: chatbotKnowledgeCreateSchema }), createKnowledgeController);
adminChatbotRouter.patch("/knowledge/:id", portalWrite, validate({ params: chatbotEntityParamsSchema, body: chatbotKnowledgeUpdateSchema }), updateKnowledgeController);
adminChatbotRouter.patch("/knowledge/:id/status", portalWrite, validate({ params: chatbotEntityParamsSchema, body: chatbotKnowledgeStatusSchema }), knowledgeStatusController);
adminChatbotRouter.get("/leads", validate({ query: chatbotLeadListSchema }), listLeadsController);
adminChatbotRouter.patch("/leads/:id/status", portalWrite, validate({ params: chatbotEntityParamsSchema, body: chatbotLeadStatusSchema }), leadStatusController);
