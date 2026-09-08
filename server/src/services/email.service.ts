import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { missingMailjetSettings, postMailjetMessage } from "./mailjet.client.js";
import { mailjetDiagnostic } from "./mailjet-errors.js";

export function recoveryEmailConfigured() {
  return missingMailjetSettings().length === 0;
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]!);

export async function sendBusinessRecoveryEmail(email: string, link: string, requestId?: string): Promise<boolean> {
  if (!recoveryEmailConfigured()) {
    logger.warn("business.recovery_delivery_failed", { requestId, reason: "configuration", missing: missingMailjetSettings() });
    return false;
  }
  try {
    await postMailjetMessage({
      From: { Email: env.MAIL_FROM_EMAIL!, Name: env.MAIL_FROM_NAME }, To: [{ Email: email }],
      Subject: "Reset your ZOBHUNGER business password",
      TextPart: `Use this link to choose a new password for your business account:\n\n${link}\n\nThe link expires in 30 minutes and can be used once. If you did not request this, you can ignore this email. Your password has not changed.`,
      HTMLPart: `<div style="font-family:Arial,sans-serif;color:#242126;max-width:560px;margin:auto;padding:24px"><h2 style="color:#ca1731">ZOBHUNGER</h2><h1 style="font-size:24px">Reset your business password</h1><p>Choose a new password for your business workspace.</p><p style="margin:28px 0"><a href="${escapeHtml(link)}" style="background:#ca1731;color:#fff;text-decoration:none;padding:14px 20px;border-radius:8px;display:inline-block">Reset password</a></p><p>This link expires in 30 minutes and can be used once.</p><p>If you did not request this, you can ignore this email. Your password has not changed.</p></div>`,
      // Preserve the fragment-based reset link and keep tokens out of click analytics.
      TrackClicks: "disabled", TrackOpens: "disabled",
    });
    logger.info("business.recovery_email_accepted", { requestId, provider: "mailjet" });
    return true;
  } catch (error) {
    logger.warn("business.recovery_delivery_failed", { requestId, ...mailjetDiagnostic(error) });
    return false;
  }
}

interface OperationalEmail { subject: string; text: string; to?: string; requestId?: string }

export async function sendOperationalEmail(input: OperationalEmail): Promise<boolean> {
  const recipient = input.to ?? env.SALES_TEAM_EMAIL;
  const missing = missingMailjetSettings();
  if (!recipient) missing.push("SALES_TEAM_EMAIL");
  if (missing.length) {
    logger.warn("email.skipped", { requestId: input.requestId, reason: "configuration", missing });
    return false;
  }
  try {
    await postMailjetMessage({ From: { Email: env.MAIL_FROM_EMAIL!, Name: env.MAIL_FROM_NAME },
      To: [{ Email: recipient! }], Subject: input.subject, TextPart: input.text });
    logger.info("email.accepted", { requestId: input.requestId, provider: "mailjet" });
    return true;
  } catch (error) {
    logger.warn("email.failed", { requestId: input.requestId, ...mailjetDiagnostic(error) });
    return false;
  }
}
