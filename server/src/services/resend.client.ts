import { env } from "../config/env.js";
import { assertResendAccepted, ResendDeliveryError, resendDiagnostic } from "./resend-errors.js";

const RESEND_EMAIL_ENDPOINT = "https://api.resend.com/emails";
const RESEND_TEST_RECIPIENT = "delivered+zobhunger-config@resend.dev";

export interface ResendMessage {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{ filename: string; content: string }>;
  idempotencyKey?: string;
}

export function missingResendSettings(): string[] {
  return (["RESEND_API_KEY", "MAIL_FROM_EMAIL"] as const).filter((key) => !env[key]);
}

function fromAddress(): string {
  return `${env.MAIL_FROM_NAME} <${env.MAIL_FROM_EMAIL!}>`;
}

export async function postResendMessage(message: ResendMessage): Promise<{ id: string }> {
  let response: Response;
  try {
    response = await fetch(RESEND_EMAIL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY!}`,
        "Content-Type": "application/json",
        "User-Agent": "zobhunger-api/0.1.0",
        ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: message.to,
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
        ...(message.attachments?.length ? { attachments: message.attachments } : {}),
      }),
      signal: AbortSignal.timeout(env.RESEND_TIMEOUT_MS),
    });
  } catch (error) {
    throw new ResendDeliveryError(resendDiagnostic(error));
  }

  let body: unknown = {};
  try {
    body = await response.json();
  } catch {
    // A non-JSON or empty success response is rejected below because Resend
    // must return a message id when it accepts an email.
  }

  if (!response.ok) {
    throw new ResendDeliveryError(resendDiagnostic({ statusCode: response.status, body }));
  }

  return assertResendAccepted(body);
}

// This sends only to Resend's documented delivered@resend.dev test address.
// It checks API-key and sender acceptance without sending to a real customer.
export async function checkResendConfiguration() {
  const missing = missingResendSettings();
  if (missing.length) return { ready: false, reason: "configuration", missing };

  try {
    const result = await postResendMessage({
      to: [RESEND_TEST_RECIPIENT],
      subject: "ZOBHUNGER email configuration check",
      text: "Resend configuration validation using the provider test recipient.",
    });
    return {
      ready: true,
      provider: "resend",
      messageId: result.id,
      salesNotificationsConfigured: Boolean(env.SALES_TEAM_EMAIL),
      message: "Resend accepted the test message. This validates provider acceptance, not delivery to a customer inbox.",
    };
  } catch (error) {
    return { ready: false, ...resendDiagnostic(error) };
  }
}
