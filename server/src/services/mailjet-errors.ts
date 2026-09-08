type JsonRecord = Record<string, unknown>;
const record = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};

const actions = {
  credentials: "Check the Mailjet Email API public/secret key pair and MAILJET_API_HOST for this account.",
  suspended: "Check the Mailjet account/API-key suspension status with Mailjet support.",
  sender: "Validate MAIL_FROM_EMAIL or its domain under the same Mailjet API key used by this server.",
  permission: "Check Mailjet account permissions, sender authorization and sending restrictions.",
  rate_limit: "Check Mailjet sending limits and retry after the provider's rate-limit window.",
  provider: "Mailjet is temporarily unavailable; try again after service is restored.",
  timeout: "Mailjet did not answer within the configured timeout; check outbound HTTPS connectivity.",
  network: "Check DNS and outbound HTTPS access to the configured Mailjet API host.",
  payload: "Review the logged Mailjet error code and related message fields.",
  unexpected_response: "Mailjet did not confirm message acceptance. Run npm run check:email on the backend.",
} as const;
export type MailjetFailureReason = keyof typeof actions;
export interface MailjetDiagnostic {
  provider: "mailjet";
  reason: MailjetFailureReason;
  action: string;
  statusCode?: number;
  errorCode?: string;
  errorIdentifier?: string;
  fields?: string[];
}
export class MailjetDeliveryError extends Error {
  constructor(readonly diagnostic: MailjetDiagnostic) { super(diagnostic.action); this.name = "MailjetDeliveryError"; }
}

// Provider errors contain request credentials and recovery tokens. Return an
// allowlisted diagnostic only; never forward raw messages, bodies or headers.
export function mailjetDiagnostic(error: unknown): MailjetDiagnostic {
  if (error instanceof MailjetDeliveryError) return error.diagnostic;
  const root = record(error), response = record(root.response);
  const body = record(root.body ?? response.data ?? response.body);
  const messages = Array.isArray(body.Messages) ? body.Messages : [];
  const failed = record(messages.find(value => record(value).Status === "error"));
  const first = record(Array.isArray(failed.Errors) ? failed.Errors[0] : undefined);
  const detail = Object.keys(first).length ? first : body;
  const rawStatus = detail.StatusCode ?? root.statusCode ?? response.status;
  const statusCode = typeof rawStatus === "number" && Number.isInteger(rawStatus) && rawStatus >= 400 && rawStatus <= 599 ? rawStatus : undefined;
  const rawCode = detail.ErrorCode;
  const errorCode = typeof rawCode === "string" && /^(?:mj|send)-\d{4}$/.test(rawCode) ? rawCode : undefined;
  const rawId = detail.ErrorIdentifier;
  const errorIdentifier = typeof rawId === "string" && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(rawId) ? rawId : undefined;
  const allowedFields = ["From", "To", "SenderID", "Subject", "TextPart", "HTMLPart", "TrackClicks", "TrackOpens", "Messages"];
  const fields = Array.isArray(detail.ErrorRelatedTo) ? allowedFields.filter(field => (detail.ErrorRelatedTo as unknown[]).includes(field)) : [];
  let reason: MailjetFailureReason = "unexpected_response";
  if (errorCode === "mj-0001") reason = "suspended";
  else if (["send-0007", "send-0008"].includes(errorCode ?? "")) reason = "sender";
  else if (statusCode === 401 || errorCode === "mj-0015") reason = "credentials";
  else if (statusCode === 403) reason = "permission";
  else if (statusCode === 429) reason = "rate_limit";
  else if (statusCode && statusCode >= 500) reason = "provider";
  else if (["ECONNABORTED", "ETIMEDOUT"].includes(String(root.code))) reason = "timeout";
  else if (["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET", "ERR_NETWORK"].includes(String(root.code))) reason = "network";
  else if (statusCode === 400 || errorCode) reason = "payload";
  return { provider: "mailjet", reason, action: actions[reason],
    ...(statusCode ? { statusCode } : {}), ...(errorCode ? { errorCode } : {}),
    ...(errorIdentifier ? { errorIdentifier } : {}), ...(fields.length ? { fields } : {}) };
}

export function assertMailjetAccepted(result: unknown): void {
  const body = record(record(result).body);
  const messages = Array.isArray(body.Messages) ? body.Messages : [];
  const first = record(messages[0]);
  if (messages.length !== 1 || first.Status !== "success" || (Array.isArray(first.Errors) && first.Errors.length > 0)) {
    throw new MailjetDeliveryError(mailjetDiagnostic(result));
  }
}
