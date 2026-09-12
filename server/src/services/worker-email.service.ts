import { logger } from "../utils/logger.js";
import { corporateEmail } from "./email-template.js";
import { missingResendSettings, postResendMessage } from "./resend.client.js";
import { resendDiagnostic } from "./resend-errors.js";

export const workerEmailConfigured = () => missingResendSettings().length === 0;

export async function sendWorkerAccessEmail(
  email: string,
  link: string,
  purpose: "EMAIL_VERIFICATION" | "PASSWORD_RESET",
  requestId?: string,
) {
  if (!workerEmailConfigured()) {
    logger.warn("worker.email_delivery_failed", { requestId, reason: "configuration" });
    return false;
  }
  const verification = purpose === "EMAIL_VERIFICATION";
  const title = verification ? "Verify your worker email" : "Reset your worker password";
  const expiry = verification ? "one hour" : "30 minutes";
  const rendered = corporateEmail({
    eyebrow: "Worker account security",
    title,
    intro: verification
      ? "Verify your email address to continue into the ZOBHUNGER worker workspace."
      : "A password reset was requested for your ZOBHUNGER worker account.",
    action: { label: verification ? "Verify email" : "Choose a new password", url: link },
    note: `This link expires in ${expiry} and can be used once. If you did not request it, ignore this email.`,
  });
  try {
    await postResendMessage({
      to: [email],
      subject: `${title} | ZOBHUNGER`,
      ...rendered,
      idempotencyKey: `worker-${purpose.toLowerCase()}-${requestId ?? "request"}`,
    });
    logger.info("worker.email_accepted", { requestId, purpose });
    return true;
  } catch (error) {
    logger.warn("worker.email_delivery_failed", { requestId, purpose, ...resendDiagnostic(error) });
    return false;
  }
}
