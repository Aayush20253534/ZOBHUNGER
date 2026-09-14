import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { chatbotRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { optionalAuth, requireAuth } from "../../middlewares/auth.middleware.js";
import { portalWrite } from "../../middlewares/portal-write.middleware.js";
import { executeChatbotToolController, sendChatbotMessageController, streamChatbotMessageController, submitChatbotLeadController } from "./chatbot.controller.js";
import { chatbotAbuseGuard } from "./chatbot-abuse.middleware.js";
import { chatbotLeadSchema, chatbotMessageSchema, chatbotToolExecutionSchema } from "./chatbot.schema.js";

export const chatbotRouter = Router();

chatbotRouter.post(
  "/messages",
  chatbotRateLimiter,
  optionalAuth,
  validate({ body: chatbotMessageSchema }),
  chatbotAbuseGuard,
  sendChatbotMessageController,
);

chatbotRouter.post(
  "/stream",
  chatbotRateLimiter,
  optionalAuth,
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

chatbotRouter.post(
  "/tools/execute",
  chatbotRateLimiter,
  requireAuth,
  portalWrite,
  validate({ body: chatbotToolExecutionSchema }),
  executeChatbotToolController,
);
