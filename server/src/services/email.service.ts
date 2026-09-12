import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { corporateEmail, type CorporateEmailInput } from "./email-template.js";
import { missingResendSettings, postResendMessage } from "./resend.client.js";
import { resendDiagnostic } from "./resend-errors.js";

export function recoveryEmailConfigured() {
  return missingResendSettings().length === 0;
}

interface OperationalEmail {
  subject: string;
  text: string;
  html?: string;
  to?: string | string[];
  replyTo?: string | string[];
  idempotencyKey?: string;
  requestId?: string;
}

function recipients(value?: string | string[]) {
  if (Array.isArray(value)) return value.map(item => item.trim()).filter(Boolean);
  return value?.trim() ? [value.trim()] : [];
}

export async function sendOperationalEmail(input: OperationalEmail): Promise<boolean> {
  const direct = recipients(input.to);
  const target = direct.length ? direct : recipients(env.SALES_TEAM_EMAIL);
  const missing = missingResendSettings();
  if (!target.length) missing.push("SALES_TEAM_EMAIL");
  if (missing.length) {
    logger.warn("email.skipped", { requestId: input.requestId, reason: "configuration", missing });
    return false;
  }
  try {
    await postResendMessage({
      to: target,
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
    });
    logger.info("email.accepted", { requestId: input.requestId, provider: "resend" });
    return true;
  } catch (error) {
    logger.warn("email.failed", { requestId: input.requestId, ...resendDiagnostic(error) });
    return false;
  }
}

interface CorporateDeliveryInput {
  to: string | string[];
  subject: string;
  content: CorporateEmailInput;
  requestId?: string;
  replyTo?: string | string[];
  idempotencyKey?: string;
}

export function sendCorporateEmail(input: CorporateDeliveryInput) {
  const rendered = corporateEmail(input.content);
  return sendOperationalEmail({
    to: input.to,
    subject: input.subject,
    ...rendered,
    requestId: input.requestId,
    replyTo: input.replyTo,
    idempotencyKey: input.idempotencyKey,
  });
}

export async function sendBusinessRecoveryEmail(email: string, link: string, requestId?: string): Promise<boolean> {
  if (!recoveryEmailConfigured()) {
    logger.warn("business.recovery_delivery_failed", { requestId, reason: "configuration", missing: missingResendSettings() });
    return false;
  }
  const rendered = corporateEmail({
    eyebrow: "Business workspace security",
    title: "Reset your business password",
    intro: "A password reset was requested for your ZOBHUNGER business workspace.",
    paragraphs: ["Use the secure one-time action below to choose a new password."],
    action: { label: "Reset password", url: link },
    note: "This link expires in 30 minutes and can be used once. If you did not request this change, ignore this email. Your password has not changed.",
  });
  try {
    await postResendMessage({
      to: [email],
      subject: "Reset your ZOBHUNGER business password",
      ...rendered,
      idempotencyKey: `business-recovery-${requestId ?? "request"}`,
    });
    logger.info("business.recovery_email_accepted", { requestId, provider: "resend" });
    return true;
  } catch (error) {
    logger.warn("business.recovery_delivery_failed", { requestId, ...resendDiagnostic(error) });
    return false;
  }
}

export async function sendAdminRecoveryEmail(email: string, link: string, requestId?: string): Promise<boolean> {
  if (!recoveryEmailConfigured()) return false;
  const rendered = corporateEmail({
    eyebrow: "Administrator security",
    title: "Reset your administrator password",
    intro: "A password reset was requested for your ZOBHUNGER administrator account.",
    paragraphs: ["Use the secure one-time action below to choose a new password."],
    action: { label: "Reset administrator password", url: link },
    note: "This link expires in 30 minutes and can be used once. If you did not request this change, ignore this email.",
  });
  try {
    await postResendMessage({ to: [email], subject: "Reset your ZOBHUNGER administrator password", ...rendered, idempotencyKey: `admin-recovery-${requestId ?? "request"}` });
    logger.info("admin.recovery_email_accepted", { requestId, provider: "resend" });
    return true;
  } catch (error) {
    logger.warn("admin.recovery_delivery_failed", { requestId, ...resendDiagnostic(error) });
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
    const rendered = corporateEmail({
      eyebrow: "Secure administration",
      title: `Activate ${input.department} administrator access`,
      intro: "Your ZOBHUNGER department workspace is ready.",
      paragraphs: ["Create your password using the secure one-time link below. After activation, sign in to your admin workspace. You can optionally enable multi-factor authentication from Security."],
      details: [{ label: "Department", value: input.department }, { label: "Invitation expires", value: expires }],
      action: { label: "Activate secure access", url: input.activationLink },
      note: "If you were not expecting this invitation, do not use the link or forward this email.",
    });
    await postResendMessage({
      to: [input.email],
      subject: `Activate your ZOBHUNGER ${input.department} administrator access`,
      ...rendered,
      idempotencyKey: `admin-invite-${input.email.toLowerCase()}-${input.expiresAt.getTime()}`,
    });
    logger.info("admin.invitation_email_accepted", { email: input.email, provider: "resend" });
    return true;
  } catch (error) {
    logger.warn("admin.invitation_delivery_failed", { email: input.email, ...resendDiagnostic(error) });
    return false;
  }
}
