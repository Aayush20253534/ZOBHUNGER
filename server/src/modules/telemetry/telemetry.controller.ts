import type { RequestHandler } from "express";
import { captureOperationalError } from "../../observability/error-monitor.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { logger } from "../../utils/logger.js";
import { sanitizeRequestTarget } from "../../utils/log-sanitizer.js";
import type { ClientErrorInput } from "./telemetry.schema.js";

export const reportClientErrorController: RequestHandler = (req, res) => {
  const input = req.body as ClientErrorInput;
  const path = input.path ? sanitizeRequestTarget(input.path) : undefined;
  logger.warn("client.error", {
    requestId: res.locals.requestId,
    source: input.source,
    message: input.message,
    path,
    digest: input.digest,
    release: input.release,
  });
  void captureOperationalError({
    source: `client.${input.source}`,
    requestId: res.locals.requestId,
    path,
    error: new Error(input.message),
    context: { digest: input.digest, release: input.release },
  });
  res.status(202).json(apiSuccessResponse("Client error accepted", { accepted: true }));
};
