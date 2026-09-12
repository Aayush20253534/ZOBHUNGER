import type { RequestHandler, Response } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { HttpError } from "../../utils/http-error.js";
import { getChatbotService } from "./chatbot.runtime.js";
import type { ChatbotMessageRequest } from "./chatbot.schema.js";

function requestContext(res: Response, signal?: AbortSignal) {
  return {
    requestId: res.locals.requestId,
    clientFingerprint: res.locals.chatbotClientFingerprint,
    ...(signal ? { signal } : {}),
  };
}

function writeSse(res: Response, event: string, data: unknown) {
  if (res.writableEnded || res.destroyed) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export const sendChatbotMessageController: RequestHandler = async (_req, res) => {
  const input = res.locals.validated.body as ChatbotMessageRequest;
  const service = await getChatbotService();
  const result = await service.reply(input, requestContext(res));

  res.status(200).json(apiSuccessResponse("Chatbot response generated.", result));
};

export const streamChatbotMessageController: RequestHandler = async (_req, res) => {
  const input = res.locals.validated.body as ChatbotMessageRequest;
  const service = await getChatbotService();
  const abortController = new AbortController();
  res.once("close", () => abortController.abort());

  res.status(200);
  res.set({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();

  try {
    writeSse(res, "ready", { requestId: res.locals.requestId ?? null });
    const result = await service.streamReply(
      input,
      requestContext(res, abortController.signal),
      (text) => writeSse(res, "delta", { text }),
    );
    if (!abortController.signal.aborted) {
      writeSse(res, "done", result);
      res.end();
    }
  } catch (error) {
    if (abortController.signal.aborted || res.destroyed) return;
    const publicError = error instanceof HttpError
      ? { message: error.message, code: error.code ?? "CHATBOT_STREAM_ERROR", details: error.details }
      : { message: "The chatbot could not generate a response. Please try again.", code: "CHATBOT_STREAM_ERROR" };
    writeSse(res, "error", publicError);
    res.end();
  }
};
