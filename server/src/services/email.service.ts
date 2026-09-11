import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { missingResendSettings, postResendMessage } from "./resend.client.js";
import { resendDiagnostic } from "./resend-errors.js";

export function recoveryEmailConfigured() {
  return missingResendSettings().length === 0;
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]!);

export async function sendBusinessRecoveryEmail(email: string, link: string, requestId?: string): Promise<boolean> {
  if (!recoveryEmailConfigured()) {
    logger.warn("business.recovery_delivery_failed", { requestId, reason: "configuration", missing: missingResendSettings() });
    return false;
  }
  try {
    await postResendMessage({
      to: [email],
      subject: "Reset your ZOBHUNGER business password",
      text: `Use this link to choose a new password for your business account:\n\n${link}\n\nThe link expires in 30 minutes and can be used once. If you did not request this, you can ignore this email. Your password has not changed.`,
      html: `<div style="font-family:Arial,sans-serif;color:#242126;max-width:560px;margin:auto;padding:24px"><h2 style="color:#ca1731">ZOBHUNGER</h2><h1 style="font-size:24px">Reset your business password</h1><p>Choose a new password for your business workspace.</p><p style="margin:28px 0"><a href="${escapeHtml(link)}" style="background:#ca1731;color:#fff;text-decoration:none;padding:14px 20px;border-radius:8px;display:inline-block">Reset password</a></p><p>This link expires in 30 minutes and can be used once.</p><p>If you did not request this, you can ignore this email. Your password has not changed.</p></div>`,
    });
    logger.info("business.recovery_email_accepted", { requestId, provider: "resend" });
    return true;
  } catch (error) {
    logger.warn("business.recovery_delivery_failed", { requestId, ...resendDiagnostic(error) });
    return false;
  }
}

interface OperationalEmail { subject: string; text: string; to?: string; requestId?: string }

export async function sendOperationalEmail(input: OperationalEmail): Promise<boolean> {
  const recipient = input.to ?? env.SALES_TEAM_EMAIL;
  const missing = missingResendSettings();
  if (!recipient) missing.push("SALES_TEAM_EMAIL");
  if (missing.length) {
    logger.warn("email.skipped", { requestId: input.requestId, reason: "configuration", missing });
    return false;
  }
  try {
    await postResendMessage({ to: [recipient!], subject: input.subject, text: input.text });
    logger.info("email.accepted", { requestId: input.requestId, provider: "resend" });
    return true;
  } catch (error) {
    logger.warn("email.failed", { requestId: input.requestId, ...resendDiagnostic(error) });
    return false;
  }
}

interface AdminInvitationEmailInput {
  email: string;
  department: string;
  activationLink: string;
  expiresAt: Date;
}

export async function sendAdminInvitationEmail(input: AdminInvitationEmailInput): Promise<boolean> {
  if (!recoveryEmailConfigured()) {
    logger.warn("admin.invitation_delivery_failed", { email: input.email, reason: "configuration", missing: missingResendSettings() });
    return false;
  }
  try {
    const expires = input.expiresAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
    await postResendMessage({
      to: [input.email],
      subject: `Activate your ZOBHUNGER ${input.department} administrator access`,
      text: `You have been invited to the ZOBHUNGER ${input.department} administration workspace.\n\nActivate your account and choose your password:\n${input.activationLink}\n\nThis one-time link expires ${expires}. After activation, sign in and complete multi-factor authentication before opening the admin workspace. If you were not expecting this invitation, do not use the link.`,
      html: `<div style="font-family:Inter,Arial,sans-serif;color:#1f1720;max-width:620px;margin:auto;padding:28px;background:#fff"><div style="border-radius:18px;overflow:hidden;border:1px solid #eadde0"><div style="padding:26px 28px;background:linear-gradient(135deg,#7f001e,#b80f2f 58%,#d41f3c);color:#fff"><div style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;opacity:.8">Secure administration</div><h1 style="margin:8px 0 0;font-size:28px;line-height:1.15">ZOBHUNGER ${escapeHtml(input.department)}</h1></div><div style="padding:28px"><h2 style="font-size:22px;margin:0 0 12px">Activate your administrator access</h2><p style="line-height:1.65;color:#62545d">Your department workspace is ready. Create your password using the secure one-time link below. You will be asked to configure multi-factor authentication after your first sign-in.</p><p style="margin:28px 0"><a href="${escapeHtml(input.activationLink)}" style="background:#b80f2f;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;display:inline-block;font-weight:700">Activate secure access</a></p><p style="font-size:14px;color:#786a72">This link expires <strong>${escapeHtml(expires)}</strong>. If you were not expecting this invitation, do not use the link.</p></div></div></div>`,
    });
    logger.info("admin.invitation_email_accepted", { email: input.email, provider: "resend" });
    return true;
  } catch (error) {
    logger.warn("admin.invitation_delivery_failed", { email: input.email, ...resendDiagnostic(error) });
    return false;
  }
}
