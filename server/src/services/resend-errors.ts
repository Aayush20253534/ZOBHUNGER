type JsonRecord = Record<string, unknown>;
const record = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};

const actions = {
  credentials: "Check RESEND_API_KEY and make sure the key is active and allowed to send email.",
  sender: "Verify MAIL_FROM_EMAIL or its domain in the Resend dashboard before sending production email.",
  permission: "Check the Resend API-key permissions and account sending restrictions.",
  rate_limit: "Check Resend sending limits and retry after the provider rate-limit window.",
  provider: "Resend is temporarily unavailable; try again after service is restored.",
  timeout: "Resend did not answer within the configured timeout; check outbound HTTPS connectivity.",
  network: "Check DNS and outbound HTTPS access to api.resend.com.",
  payload: "Review the email fields being sent to Resend.",
  unexpected_response: "Resend did not confirm message acceptance. Run npm run check:email on the backend.",
} as const;

export type ResendFailureReason = keyof typeof actions;
export interface ResendDiagnostic {
  provider: "resend";
  reason: ResendFailureReason;
  action: string;
  statusCode?: number;
  errorCode?: string;
}

export class ResendDeliveryError extends Error {
  constructor(readonly diagnostic: ResendDiagnostic) {
    super(diagnostic.action);
    this.name = "ResendDeliveryError";
  }
}

// Resend failures can include sender addresses and request details. Only return
// an allowlisted diagnostic so credentials, recipients and reset tokens never
// leak into application logs.
export function resendDiagnostic(error: unknown): ResendDiagnostic {
  if (error instanceof ResendDeliveryError) return error.diagnostic;

  const root = record(error);
  const response = record(root.response);
  const body = record(root.body ?? response.data ?? response.body);
  const cause = record(root.cause);

  const rawStatus = root.statusCode ?? response.status ?? body.statusCode;
  const statusCode = typeof rawStatus === "number" && Number.isInteger(rawStatus) && rawStatus >= 400 && rawStatus <= 599
    ? rawStatus
    : undefined;

  const rawCode = body.name ?? body.code ?? root.code;
  const normalizedCode = typeof rawCode === "string" ? rawCode.trim().toLowerCase() : "";
  const errorCode = /^[a-z][a-z0-9_-]{1,63}$/.test(normalizedCode) ? normalizedCode : undefined;
  const providerMessage = typeof body.message === "string" ? body.message.toLowerCase() : "";
  const networkCode = String(root.code ?? cause.code ?? "");
  const errorName = String(root.name ?? "");

  let reason: ResendFailureReason = "unexpected_response";
  if (errorCode === "invalid_api_key" || statusCode === 401) reason = "credentials";
  else if (
    (statusCode === 403 || statusCode === 422) &&
    (providerMessage.includes("domain") || providerMessage.includes("from address") || providerMessage.includes("sender"))
  ) reason = "sender";
  else if (statusCode === 403) reason = "permission";
  else if (statusCode === 429 || errorCode === "rate_limit_exceeded") reason = "rate_limit";
  else if (statusCode && statusCode >= 500) reason = "provider";
  else if (["AbortError", "TimeoutError"].includes(errorName) || ["ECONNABORTED", "ETIMEDOUT"].includes(networkCode)) reason = "timeout";
  else if (["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET", "ERR_NETWORK"].includes(networkCode)) reason = "network";
  else if (statusCode === 400 || statusCode === 422 || errorCode === "validation_error") reason = "payload";

  return {
    provider: "resend",
    reason,
    action: actions[reason],
    ...(statusCode ? { statusCode } : {}),
    ...(errorCode ? { errorCode } : {}),
  };
}

export function assertResendAccepted(result: unknown): { id: string } {
  const id = record(result).id;
  if (typeof id !== "string" || !id.trim()) {
    throw new ResendDeliveryError({
      provider: "resend",
      reason: "unexpected_response",
      action: actions.unexpected_response,
    });
  }
  return { id };
}
