import type { RequestHandler, Response } from "express";
import { apiSuccessResponse } from "../../../utils/api-response.js";
import type {
  ChatbotAdminListInput, ChatbotAnalyticsInput, ChatbotKnowledgeCreateInput, ChatbotKnowledgeStatusInput,
  ChatbotKnowledgeUpdateInput, ChatbotLeadListInput,
} from "./chatbot-admin.schema.js";
import {
  changeChatbotKnowledgeStatus, chatbotAnalytics, createChatbotKnowledge, listChatbotKnowledge,
  listChatbotLeads, updateChatbotKnowledge, updateChatbotLeadStatus,
} from "./chatbot-admin.service.js";

function actorId(res: Response) { return res.locals.user.id as string; }
export const listKnowledgeController: RequestHandler = async (_req, res) => res.json(apiSuccessResponse("AI knowledge retrieved", await listChatbotKnowledge(res.locals.validated.query as ChatbotAdminListInput)));
export const createKnowledgeController: RequestHandler = async (_req, res) => res.status(201).json(apiSuccessResponse("Knowledge draft created", await createChatbotKnowledge(actorId(res), res.locals.validated.body as ChatbotKnowledgeCreateInput)));
export const updateKnowledgeController: RequestHandler = async (_req, res) => res.json(apiSuccessResponse("Knowledge updated", await updateChatbotKnowledge(actorId(res), res.locals.validated.params.id, res.locals.validated.body as ChatbotKnowledgeUpdateInput)));
export const knowledgeStatusController: RequestHandler = async (_req, res) => res.json(apiSuccessResponse("Knowledge status updated", await changeChatbotKnowledgeStatus(actorId(res), res.locals.validated.params.id, res.locals.validated.body as ChatbotKnowledgeStatusInput)));
export const listLeadsController: RequestHandler = async (_req, res) => res.json(apiSuccessResponse("AI assistant leads retrieved", await listChatbotLeads(res.locals.validated.query as ChatbotLeadListInput)));
export const leadStatusController: RequestHandler = async (_req, res) => res.json(apiSuccessResponse("Lead status updated", await updateChatbotLeadStatus(actorId(res), res.locals.validated.params.id, res.locals.validated.body.status)));
export const analyticsController: RequestHandler = async (_req, res) => res.json(apiSuccessResponse("AI assistant analytics retrieved", await chatbotAnalytics(res.locals.validated.query as ChatbotAnalyticsInput)));
