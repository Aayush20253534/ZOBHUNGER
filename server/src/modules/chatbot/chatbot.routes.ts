import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { chatbotRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { sendChatbotMessageController } from "./chatbot.controller.js";
import { chatbotAbuseGuard } from "./chatbot-abuse.middleware.js";
import { chatbotMessageSchema } from "./chatbot.schema.js";

export const chatbotRouter = Router();

chatbotRouter.post(
  "/messages",
  chatbotRateLimiter,
  validate({ body: chatbotMessageSchema }),
  chatbotAbuseGuard,
  sendChatbotMessageController,
);
