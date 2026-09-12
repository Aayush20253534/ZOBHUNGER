import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { getChatbotService } from "./chatbot.runtime.js";
import type { ChatbotMessageRequest } from "./chatbot.schema.js";

export const sendChatbotMessageController: RequestHandler = async (_req, res) => {
  const input = res.locals.validated.body as ChatbotMessageRequest;
  const service = await getChatbotService();
  const result = await service.reply(input);

  res.status(200).json(apiSuccessResponse("Chatbot response generated.", result));
};
