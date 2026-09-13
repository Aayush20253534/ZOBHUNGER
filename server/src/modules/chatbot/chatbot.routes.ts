import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { chatbotRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { sendChatbotMessageController, streamChatbotMessageController, submitChatbotLeadController } from "./chatbot.controller.js";
import { chatbotAbuseGuard } from "./chatbot-abuse.middleware.js";
import { chatbotLeadSchema, chatbotMessageSchema } from "./chatbot.schema.js";

export const chatbotRouter = Router();

chatbotRouter.post(
  "/messages",
  chatbotRateLimiter,
  validate({ body: chatbotMessageSchema }),
  chatbotAbuseGuard,
  sendChatbotMessageController,
);

chatbotRouter.post(
  "/stream",
  chatbotRateLimiter,
  validate({ body: chatbotMessageSchema }),
  chatbotAbuseGuard,
  streamChatbotMessageController,
);

chatbotRouter.post(
  "/leads",
  chatbotRateLimiter,
  validate({ body: chatbotLeadSchema }),
  submitChatbotLeadController,
);
