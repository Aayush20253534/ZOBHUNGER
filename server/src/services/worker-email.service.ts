import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { missingMailjetSettings, postMailjetMessage } from "./mailjet.client.js";
import { mailjetDiagnostic } from "./mailjet-errors.js";

export const workerEmailConfigured = () => missingMailjetSettings().length === 0;
export async function sendWorkerAccessEmail(email: string, link: string, purpose: "EMAIL_VERIFICATION" | "PASSWORD_RESET", requestId?: string) {
  if (!workerEmailConfigured()) { logger.warn("worker.email_delivery_failed", { requestId, reason: "configuration" }); return false; }
  const verification = purpose === "EMAIL_VERIFICATION";
  const title = verification ? "Verify your worker email" : "Reset your worker password";
  const expiry = verification ? "one hour" : "30 minutes";
  const escaped = link.replace(/[&<>"']/g, value => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[value]!);
  try {
    await postMailjetMessage({
      From: { Email: env.MAIL_FROM_EMAIL!, Name: env.MAIL_FROM_NAME }, To: [{ Email: email }],
      Subject: `${title} | ZOBHUNGER`,
      TextPart: `${title}\n\n${link}\n\nThis link expires in ${expiry} and can be used once. If you did not request it, ignore this email.`,
      HTMLPart: `<div style="max-width:560px;margin:auto;padding:28px;font-family:Arial,sans-serif;color:#242126"><h2 style="color:#ca1731">ZOBHUNGER</h2><p>YOUR WORKER ACCOUNT</p><h1 style="font-size:28px">${title}</h1><p>Take the next step towards your next opportunity.</p><p style="margin:28px 0"><a href="${escaped}" style="display:inline-block;background:#ca1731;color:white;padding:14px 20px;text-decoration:none;border-radius:10px">${verification ? "Verify email" : "Choose a new password"}</a></p><p>This link expires in ${expiry} and can be used once. If you did not request it, ignore this email.</p></div>`,
      TrackClicks: "disabled", TrackOpens: "disabled",
    });
    logger.info("worker.email_accepted", { requestId, purpose }); return true;
  } catch (error) { logger.warn("worker.email_delivery_failed", { requestId, purpose, ...mailjetDiagnostic(error) }); return false; }
}
