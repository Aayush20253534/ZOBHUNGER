import type { RequestHandler, Response } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { HttpError } from "../../utils/http-error.js";
import { getChatbotService } from "./chatbot.runtime.js";
import type { ChatbotLeadRequest, ChatbotMessageRequest, ChatbotToolExecutionRequest } from "./chatbot.schema.js";
import { submitChatbotLead } from "./chatbot.leads.js";
import { executeConfirmedChatbotTool } from "./chatbot.tools.js";
import type { ChatbotRequestActor } from "./chatbot.types.js";

function actorFromResponse(res: Response): ChatbotRequestActor | undefined {
  const authUser = res.locals.authUser as {
    id?: string; email?: string; phone?: string | null; role?: unknown;
    adminDepartment?: string | null; adminPermissions?: string[];
  } | undefined;
  if (!authUser?.id || !authUser.email || !["ADMIN", "BUSINESS", "WORKER", "PLACEMENT_CELL"].includes(String(authUser.role))) return undefined;
  return {
    id: authUser.id, email: authUser.email, phone: authUser.phone ?? null,
    role: authUser.role as ChatbotRequestActor["role"],
    adminDepartment: authUser.adminDepartment ?? null, adminPermissions: authUser.adminPermissions ?? [],
  };
}

function requestContext(res: Response, signal?: AbortSignal) {
  const actor = actorFromResponse(res);
  return {
    requestId: res.locals.requestId,
    clientFingerprint: res.locals.chatbotClientFingerprint,
    ...(actor ? { actor } : {}),
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


export const submitChatbotLeadController: RequestHandler = async (_req, res) => {
  const input = res.locals.validated.body as ChatbotLeadRequest;
  const result = await submitChatbotLead(input, res.locals.requestId);
  res.status(201).json(apiSuccessResponse(result.message, result));
};

export const executeChatbotToolController: RequestHandler = async (_req, res) => {
  const input = res.locals.validated.body as ChatbotToolExecutionRequest;
  const actor = actorFromResponse(res);
  if (!actor) throw new HttpError(401, "Authentication required", { code: "UNAUTHENTICATED" });
  const result = await executeConfirmedChatbotTool(actor, input.tool, input.input);
  res.status(200).json(apiSuccessResponse(result.message, result));
};
