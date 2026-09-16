import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { notifyInternshipDocumentPaymentCompleted, notifyInternshipDocumentPaymentLink } from "../../services/notification.service.js";
import { HttpError } from "../../utils/http-error.js";
import { logger } from "../../utils/logger.js";
import {
  cashfreeCheckoutEnvironment,
  createCashfreeOrder,
  fetchCashfreeOrder,
  getCashfreeOrderPayments,
  terminateCashfreeOrder,
  type CashfreeOrder,
  type CashfreeOrderPayment,
} from "./cashfree.client.js";
import type { CashfreePaymentWebhook, CreateInternshipDocumentPayment } from "./internship-payments.schema.js";

const paymentSelect = {
  id: true,
  careerApplicationId: true,
  requestKey: true,
  recipientName: true,
  customerEmail: true,
  customerPhone: true,
  documentDescription: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  postalCode: true,
  courierNote: true,
  amountPaise: true,
  currency: true,
  cashfreeLinkId: true,
  cashfreeCfLinkId: true,
  cashfreeLinkUrl: true,
  cashfreeStatus: true,
  linkExpiresAt: true,
  status: true,
  amountPaidPaise: true,
  cashfreeOrderId: true,
  cashfreeTransactionId: true,
  paidAt: true,
  receiptNumber: true,
  receiptIssuedAt: true,
  receiptEmailStatus: true,
  createdAt: true,
  updatedAt: true,
} as const;

type PaymentRecord = Awaited<ReturnType<typeof findPaymentByApplication>>;
type SavedPayment = NonNullable<PaymentRecord>;

function appOrigin() {
  return env.PUBLIC_APP_URL ?? env.CLIENT_ORIGIN.split(",")[0].trim();
}

function publicUrl(path: string) {
  const origin = appOrigin();
  return new URL(path, origin.endsWith("/") ? origin : `${origin}/`).toString();
}

function normalizeCashfreePhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (!/^\d{10}$/.test(digits)) throw new HttpError(400, "Cashfree checkout requires a valid 10-digit Indian mobile number", { code: "CASHFREE_PHONE_INVALID" });
  return digits;
}

function checkoutLinkVersion() {
  return `zbh_checkout_${randomUUID().replaceAll("-", "")}`;
}

function revokedCheckoutLinkVersion() {
  return `zbh_revoked_${randomUUID().replaceAll("-", "")}`;
}

function cashfreeOrderId(paymentId: string, checkoutVersion: string) {
  const paymentPart = paymentId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
  const revision = createHmac("sha256", env.JWT_SECRET)
    .update(`internship-document-order:v2:${checkoutVersion}`)
    .digest("hex")
    .slice(0, 10);
  return `zbh_intdoc_${paymentPart}_${revision}`;
}

function cashfreeCustomerId(applicationId: string) {
  return `zbh_${applicationId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 36)}`;
}

function toPaise(value: number | string | undefined | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100);
}

function receiptNumber(paymentId: string, paidAt: Date) {
  const suffix = paymentId.replace(/[^a-zA-Z0-9]/g, "").slice(-10).toUpperCase();
  return `ZBH-INTDOC-${paidAt.getUTCFullYear()}-${suffix}`;
}

function receiptSignature(paymentId: string, expiresAtSeconds: number) {
  return createHmac("sha256", env.JWT_SECRET)
    .update(`internship-document-receipt:v2:${paymentId}:${expiresAtSeconds}`)
    .digest("hex");
}

function receiptToken(paymentId: string, now = Date.now()) {
  const expiresAtSeconds = Math.floor(now / 1000) + env.PAYMENT_RECEIPT_TOKEN_TTL_SECONDS;
  return `${expiresAtSeconds}.${receiptSignature(paymentId, expiresAtSeconds)}`;
}

function legacyCheckoutSignature(paymentId: string) {
  return createHmac("sha256", env.JWT_SECRET).update(`internship-document-checkout:${paymentId}`).digest("hex");
}

function checkoutSignature(paymentId: string, expiresAtSeconds: number, checkoutVersion: string) {
  return createHmac("sha256", env.JWT_SECRET)
    .update(`internship-document-checkout:v2:${paymentId}:${expiresAtSeconds}:${checkoutVersion}`)
    .digest("hex");
}

function validHexSignature(signature: string, expectedHex: string) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = Buffer.from(expectedHex, "hex");
  let received: Buffer;
  try { received = Buffer.from(signature, "hex"); } catch { return false; }
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function checkoutToken(paymentId: string, checkoutVersion: string, expiresAt: Date) {
  const expiresAtSeconds = Math.floor(expiresAt.getTime() / 1000);
  const signature = checkoutSignature(paymentId, expiresAtSeconds, checkoutVersion);
  return `${paymentId}.v2.${expiresAtSeconds}.${checkoutVersion}.${signature}`;
}

function paymentCheckoutUrl(paymentId: string, checkoutVersion: string, expiresAt: Date) {
  return publicUrl(`/pay/${encodeURIComponent(checkoutToken(paymentId, checkoutVersion, expiresAt))}`);
}

function revokedCheckoutUrl() {
  return publicUrl("/pay/revoked");
}

type ParsedCheckoutToken =
  | { paymentId: string; legacy: true }
  | { paymentId: string; legacy: false; expiresAtSeconds: number; checkoutVersion: string };

function parseCheckoutToken(token: string): ParsedCheckoutToken | null {
  const parts = token.split(".");
  if (parts.length === 2) {
    const [paymentId, signature] = parts;
    if (!paymentId || paymentId.length < 10 || paymentId.length > 100 || !signature) return null;
    return validHexSignature(signature, legacyCheckoutSignature(paymentId)) ? { paymentId, legacy: true } : null;
  }
  if (parts.length !== 5 || parts[1] !== "v2") return null;
  const [paymentId, _version, expiryValue, checkoutVersion, signature] = parts;
  if (!paymentId || paymentId.length < 10 || paymentId.length > 100) return null;
  if (!/^\d{10,12}$/.test(expiryValue ?? "") || !/^zbh_checkout_[a-f0-9]{32}$/i.test(checkoutVersion ?? "") || !signature) return null;
  const expiresAtSeconds = Number(expiryValue);
  if (!Number.isSafeInteger(expiresAtSeconds)) return null;
  return validHexSignature(signature, checkoutSignature(paymentId, expiresAtSeconds, checkoutVersion))
    ? { paymentId, legacy: false, expiresAtSeconds, checkoutVersion }
    : null;
}

function storedCheckoutToken(url: string) {
  try {
    const parsed = new URL(url);
    const marker = "/pay/";
    if (!parsed.pathname.startsWith(marker)) return null;
    return decodeURIComponent(parsed.pathname.slice(marker.length));
  } catch {
    return null;
  }
}

export function internshipDocumentReceiptUrl(paymentId: string) {
  return publicUrl(`/api/backend/internship-payments/receipts/${encodeURIComponent(paymentId)}?token=${encodeURIComponent(receiptToken(paymentId))}`);
}

export function verifyInternshipDocumentReceiptToken(paymentId: string, token: string, now = Date.now()) {
  const [expiryValue, signature, ...extra] = token.split(".");
  if (extra.length || !/^\d{10,12}$/.test(expiryValue ?? "") || !/^[a-f0-9]{64}$/i.test(signature ?? "")) return false;
  const expiresAtSeconds = Number(expiryValue);
  if (!Number.isSafeInteger(expiresAtSeconds) || expiresAtSeconds <= Math.floor(now / 1000)) return false;
  const expected = Buffer.from(receiptSignature(paymentId, expiresAtSeconds), "hex");
  let received: Buffer;
  try { received = Buffer.from(signature, "hex"); } catch { return false; }
  return received.length === expected.length && timingSafeEqual(received, expected);
}

async function findPaymentByApplication(careerApplicationId: string) {
  return prisma.internshipDocumentPayment.findUnique({ where: { careerApplicationId }, select: paymentSelect });
}

async function findPaymentFromCheckoutToken(token: string) {
  const parsed = parseCheckoutToken(token);
  if (!parsed) throw new HttpError(404, "Payment request not found", { code: "PAYMENT_CHECKOUT_NOT_FOUND" });
  const payment = await prisma.internshipDocumentPayment.findUnique({ where: { id: parsed.paymentId }, select: paymentSelect });
  if (!payment) throw new HttpError(404, "Payment request not found", { code: "PAYMENT_CHECKOUT_NOT_FOUND" });

  if (parsed.legacy) {
    // Legacy links remain usable only while they are still the exact current URL
    // stored on the payment row. Reissue/cancellation changes that URL, so a
    // previously shared v1 token can never become valid again.
    if (storedCheckoutToken(payment.cashfreeLinkUrl) !== token) {
      throw new HttpError(404, "Payment request not found", { code: "PAYMENT_CHECKOUT_NOT_FOUND" });
    }
  } else {
    const storedExpirySeconds = payment.linkExpiresAt ? Math.floor(payment.linkExpiresAt.getTime() / 1000) : null;
    if (payment.cashfreeLinkId !== parsed.checkoutVersion || storedExpirySeconds !== parsed.expiresAtSeconds) {
      throw new HttpError(404, "Payment request not found", { code: "PAYMENT_CHECKOUT_NOT_FOUND" });
    }
  }

  const current = await expireIfNeeded(payment);
  const expiresAtSeconds = parsed.legacy
    ? (current.linkExpiresAt ? Math.floor(current.linkExpiresAt.getTime() / 1000) : 0)
    : parsed.expiresAtSeconds;
  if (!expiresAtSeconds || expiresAtSeconds <= Math.floor(Date.now() / 1000)) {
    throw new HttpError(410, "This payment request has expired. Ask the ZOBHUNGER team to issue a new one.", { code: "PAYMENT_CHECKOUT_EXPIRED" });
  }
  return current;
}

async function expireIfNeeded(payment: SavedPayment) {
  if (payment.status !== "ACTIVE" || !payment.linkExpiresAt || payment.linkExpiresAt.getTime() > Date.now()) return payment;
  return prisma.internshipDocumentPayment.update({
    where: { id: payment.id },
    data: { status: "EXPIRED", cashfreeStatus: payment.cashfreeStatus === "PAID" ? "PAID" : "EXPIRED" },
    select: paymentSelect,
  });
}

export async function getInternshipDocumentPayment(careerApplicationId: string) {
  const payment = await findPaymentByApplication(careerApplicationId);
  if (!payment) return null;
  const current = await expireIfNeeded(payment);
  return {
    ...current,
    receiptUrl: current.status === "PAID" && current.receiptNumber ? internshipDocumentReceiptUrl(current.id) : null,
  };
}

async function ensureInternshipApplication(applicationId: string) {
  const application = await prisma.careerApplication.findFirst({
    where: { id: applicationId, applicationType: "INTERNSHIP" },
    select: { id: true, fullName: true, email: true, phone: true, status: true },
  });
  if (!application) throw new HttpError(404, "Internship application not found", { code: "INTERNSHIP_APPLICATION_NOT_FOUND" });
  if (application.status === "REJECTED") throw new HttpError(409, "A hard-copy payment request cannot be issued for a rejected internship application", { code: "INTERNSHIP_PAYMENT_NOT_ELIGIBLE" });
  return application;
}

function successfulPayment(payments: CashfreeOrderPayment[]) {
  return payments.find(payment => payment.payment_status === "SUCCESS") ?? payments[0];
}

async function deliverReceiptEmail(payment: SavedPayment, deliveryAttempt = "automatic") {
  if (payment.status !== "PAID" || !payment.receiptNumber || !payment.paidAt) return false;
  const accepted = await notifyInternshipDocumentPaymentCompleted({
    applicationId: payment.careerApplicationId,
    paymentId: payment.id,
    recipientName: payment.recipientName,
    email: payment.customerEmail,
    documentDescription: payment.documentDescription,
    amountPaise: payment.amountPaidPaise ?? payment.amountPaise,
    receiptNumber: payment.receiptNumber,
    transactionId: payment.cashfreeTransactionId,
    paidAt: payment.paidAt,
    deliveryLocation: `${payment.city}, ${payment.state} ${payment.postalCode}`,
    receiptUrl: internshipDocumentReceiptUrl(payment.id),
    deliveryAttempt,
  });
  await prisma.internshipDocumentPayment.update({ where: { id: payment.id }, data: { receiptEmailStatus: accepted ? "ACCEPTED" : "FAILED" } });
  return accepted;
}

async function issueReceipt(payment: SavedPayment, input: { orderId?: string; transactionId?: string; amountPaidPaise?: number; paidAt?: string }) {
  if (payment.status === "PAID" && payment.receiptNumber) return payment;
  const amountPaidPaise = input.amountPaidPaise ?? payment.amountPaidPaise ?? payment.amountPaise;
  const paidAt = input.paidAt && !Number.isNaN(Date.parse(input.paidAt)) ? new Date(input.paidAt) : new Date();
  const number = payment.receiptNumber ?? receiptNumber(payment.id, paidAt);
  const changed = await prisma.internshipDocumentPayment.updateMany({
    where: { id: payment.id, status: { not: "PAID" } },
    data: {
      status: "PAID",
      cashfreeStatus: "PAID",
      amountPaidPaise,
      cashfreeOrderId: input.orderId ?? payment.cashfreeOrderId,
      cashfreeTransactionId: input.transactionId ?? payment.cashfreeTransactionId,
      paidAt,
      receiptNumber: number,
      receiptIssuedAt: new Date(),
      receiptEmailStatus: "PENDING",
    },
  });
  const saved = await prisma.internshipDocumentPayment.findUnique({ where: { id: payment.id }, select: paymentSelect });
  if (!saved) throw new HttpError(404, "Document payment record not found", { code: "INTERNSHIP_PAYMENT_NOT_FOUND" });
  if (changed.count === 1) {
    await prisma.auditLog.create({
      data: {
        action: "internship.document_payment_paid",
        entityType: "CareerApplication",
        entityId: saved.careerApplicationId,
        metadata: { paymentId: saved.id, amountPaise: saved.amountPaidPaise, receiptNumber: saved.receiptNumber, transactionId: saved.cashfreeTransactionId },
      },
    });
    void deliverReceiptEmail(saved).catch(error => logger.warn("internship.document_receipt_email_failed", { paymentId: saved.id, reason: error instanceof Error ? error.message : "unknown" }));
  }
  return saved;
}

function assertOrderMatchesPayment(payment: SavedPayment, order: CashfreeOrder) {
  const providerAmount = toPaise(order.order_amount);
  if (order.order_currency !== payment.currency || providerAmount !== payment.amountPaise) {
    logger.error("cashfree.payment_mismatch", undefined, {
      paymentId: payment.id,
      orderId: order.order_id,
      expectedAmountPaise: payment.amountPaise,
      providerAmountPaise: providerAmount,
      expectedCurrency: payment.currency,
      providerCurrency: order.order_currency,
    });
    throw new HttpError(409, "Cashfree order details do not match the amount issued by the admin", { code: "CASHFREE_PAYMENT_MISMATCH" });
  }
}

async function applyCashfreeOrderState(payment: SavedPayment, order: CashfreeOrder, payments: CashfreeOrderPayment[] = []) {
  assertOrderMatchesPayment(payment, order);
  if (order.order_status === "PAID") {
    const transaction = successfulPayment(payments);
    const paidAmount = toPaise(transaction?.payment_amount ?? order.order_amount);
    const paymentCurrency = transaction?.payment_currency ?? order.order_currency;
    if (paymentCurrency !== payment.currency || paidAmount < payment.amountPaise) {
      throw new HttpError(409, "Cashfree reports the order as paid but the collected amount does not match", { code: "CASHFREE_PAYMENT_MISMATCH" });
    }
    return issueReceipt(payment, {
      orderId: order.order_id,
      transactionId: transaction?.cf_payment_id != null ? String(transaction.cf_payment_id) : undefined,
      amountPaidPaise: paidAmount,
      paidAt: transaction?.payment_time,
    });
  }

  let status: "ACTIVE" | "EXPIRED" | "CANCELLED" = payment.status === "CANCELLED" ? "CANCELLED" : "ACTIVE";
  if (order.order_status === "EXPIRED") status = "EXPIRED";
  if (order.order_status === "TERMINATED" || order.order_status === "TERMINATION_REQUESTED") status = "CANCELLED";
  return prisma.internshipDocumentPayment.update({
    where: { id: payment.id },
    data: { cashfreeStatus: order.order_status, status },
    select: paymentSelect,
  });
}

async function refreshPayment(payment: SavedPayment) {
  const current = await expireIfNeeded(payment);
  if (current.status === "PAID" || !current.cashfreeOrderId) return current;
  const order = await fetchCashfreeOrder(current.cashfreeOrderId);
  const payments = order.order_status === "PAID" ? await getCashfreeOrderPayments(order.order_id) : [];
  return applyCashfreeOrderState(current, order, payments);
}

export async function createInternshipDocumentPayment(applicationId: string, actorUserId: string, input: CreateInternshipDocumentPayment) {
  cashfreeCheckoutEnvironment();
  const application = await ensureInternshipApplication(applicationId);
  const priorByKey = await prisma.internshipDocumentPayment.findUnique({ where: { requestKey: input.requestKey }, select: paymentSelect });
  if (priorByKey) {
    if (priorByKey.careerApplicationId !== applicationId) throw new HttpError(409, "This payment request key is already used", { code: "PAYMENT_REQUEST_KEY_REUSED" });
    return priorByKey;
  }
  const existingRaw = await findPaymentByApplication(applicationId);
  const existing = existingRaw ? await expireIfNeeded(existingRaw) : null;
  if (existing?.status === "PAID") throw new HttpError(409, "This hard-copy request is already paid", { code: "INTERNSHIP_PAYMENT_ALREADY_PAID" });
  if (existing?.status === "ACTIVE") throw new HttpError(409, "An active payment request already exists. Cancel it before creating a replacement.", { code: "INTERNSHIP_PAYMENT_LINK_ACTIVE" });

  const customerPhone = normalizeCashfreePhone(input.customerPhone);
  const amountPaise = Math.round(input.amountRupees * 100);
  const expiresAt = new Date(Date.now() + input.expiryDays * 24 * 60 * 60_000);
  const paymentId = existing?.id ?? randomUUID();
  const linkVersion = checkoutLinkVersion();
  const shareableUrl = paymentCheckoutUrl(paymentId, linkVersion, expiresAt);
  const data = {
    requestKey: input.requestKey,
    createdByUserId: actorUserId,
    recipientName: input.recipientName,
    customerEmail: input.customerEmail,
    customerPhone,
    documentDescription: input.documentDescription,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2 || null,
    city: input.city,
    state: input.state,
    postalCode: input.postalCode,
    courierNote: input.courierNote || null,
    amountPaise,
    currency: "INR",
    // Legacy column names are retained, but the ID is now a per-issuance checkout
    // version. Rotating it makes every older signed link permanently invalid.
    cashfreeLinkId: linkVersion,
    cashfreeCfLinkId: null,
    cashfreeLinkUrl: shareableUrl,
    cashfreeStatus: "NOT_STARTED",
    linkExpiresAt: expiresAt,
    status: "ACTIVE" as const,
    amountPaidPaise: null,
    cashfreeOrderId: null,
    cashfreeTransactionId: null,
    paidAt: null,
    receiptNumber: null,
    receiptIssuedAt: null,
    receiptEmailStatus: null,
  };
  const saved = existing
    ? await prisma.internshipDocumentPayment.update({ where: { id: existing.id }, data, select: paymentSelect })
    : await prisma.internshipDocumentPayment.create({ data: { id: paymentId, careerApplicationId: applicationId, ...data }, select: paymentSelect });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: "internship.document_payment_request_created",
      entityType: "CareerApplication",
      entityId: applicationId,
      // Never persist the bearer checkout URL in audit metadata. The payment row
      // keeps the current link for the admin UI; audit history stores identifiers only.
      metadata: { paymentId: saved.id, amountPaise, documentDescription: saved.documentDescription },
    },
  });
  void notifyInternshipDocumentPaymentLink({
    applicationId,
    recipientName: saved.recipientName || application.fullName,
    email: saved.customerEmail || application.email,
    documentDescription: saved.documentDescription,
    amountPaise: saved.amountPaise,
    expiresAt: saved.linkExpiresAt ?? expiresAt,
    paymentLink: saved.cashfreeLinkUrl,
  }).catch(error => logger.warn("internship.document_payment_link_email_failed", { paymentId: saved.id, reason: error instanceof Error ? error.message : "unknown" }));
  return saved;
}

export async function getPublicInternshipDocumentPayment(token: string) {
  const payment = await findPaymentFromCheckoutToken(token);
  return {
    recipientName: payment.recipientName,
    documentDescription: payment.documentDescription,
    amountPaise: payment.amountPaise,
    currency: payment.currency,
    status: payment.status,
    cashfreeStatus: payment.cashfreeStatus,
    expiresAt: payment.linkExpiresAt,
    paidAt: payment.paidAt,
    receiptUrl: payment.status === "PAID" && payment.receiptNumber ? internshipDocumentReceiptUrl(payment.id) : null,
  };
}

export async function startPublicInternshipDocumentCheckout(token: string) {
  const payment = await findPaymentFromCheckoutToken(token);
  if (payment.status === "PAID") return { status: "PAID" as const, receiptUrl: payment.receiptNumber ? internshipDocumentReceiptUrl(payment.id) : null };
  if (payment.status === "CANCELLED") throw new HttpError(410, "This payment request has been cancelled. Contact the ZOBHUNGER team if you still need the hard copy.", { code: "PAYMENT_CHECKOUT_CANCELLED" });
  if (payment.status === "EXPIRED") throw new HttpError(410, "This payment request has expired. Ask the ZOBHUNGER team to issue a new one.", { code: "PAYMENT_CHECKOUT_EXPIRED" });

  let order: CashfreeOrder;
  if (payment.cashfreeOrderId) {
    order = await fetchCashfreeOrder(payment.cashfreeOrderId);
    const refreshed = await applyCashfreeOrderState(payment, order, order.order_status === "PAID" ? await getCashfreeOrderPayments(order.order_id) : []);
    if (refreshed.status === "PAID") return { status: "PAID" as const, receiptUrl: refreshed.receiptNumber ? internshipDocumentReceiptUrl(refreshed.id) : null };
    if (refreshed.status !== "ACTIVE") throw new HttpError(410, "This payment request is no longer payable. Contact the ZOBHUNGER team for a replacement.", { code: "PAYMENT_CHECKOUT_INACTIVE" });
  } else {
    order = await createCashfreeOrder({
      orderId: cashfreeOrderId(payment.id, payment.cashfreeLinkId),
      amountRupees: payment.amountPaise / 100,
      purpose: `Printing and courier charges - ${payment.documentDescription}`,
      customerId: cashfreeCustomerId(payment.careerApplicationId),
      customerName: payment.recipientName,
      customerEmail: payment.customerEmail,
      customerPhone: payment.customerPhone,
      expiresAt: payment.linkExpiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60_000),
      returnUrl: `${payment.cashfreeLinkUrl}?returned=1`,
      notifyUrl: publicUrl("/api/backend/payments/cashfree/webhook"),
      requestKey: payment.requestKey,
      tags: { payment_id: payment.id, application_id: payment.careerApplicationId, checkout_version: payment.cashfreeLinkId },
    });
    assertOrderMatchesPayment(payment, order);
    await prisma.internshipDocumentPayment.update({
      where: { id: payment.id },
      data: { cashfreeOrderId: order.order_id, cashfreeStatus: order.order_status },
    });
  }

  if (order.order_status !== "ACTIVE" || !order.payment_session_id) {
    throw new HttpError(502, "Cashfree did not return an active checkout session", { code: "CASHFREE_CHECKOUT_SESSION_INVALID" });
  }
  return {
    status: "ACTIVE" as const,
    orderId: order.order_id,
    paymentSessionId: order.payment_session_id,
    environment: cashfreeCheckoutEnvironment(),
  };
}

export async function refreshPublicInternshipDocumentPayment(token: string) {
  const payment = await findPaymentFromCheckoutToken(token);
  const saved = await refreshPayment(payment);
  return {
    status: saved.status,
    cashfreeStatus: saved.cashfreeStatus,
    paidAt: saved.paidAt,
    receiptUrl: saved.status === "PAID" && saved.receiptNumber ? internshipDocumentReceiptUrl(saved.id) : null,
  };
}

export async function cancelInternshipDocumentPayment(applicationId: string, actorUserId: string) {
  await ensureInternshipApplication(applicationId);
  const paymentRaw = await findPaymentByApplication(applicationId);
  if (!paymentRaw) throw new HttpError(404, "No hard-copy payment request exists for this internship", { code: "INTERNSHIP_PAYMENT_NOT_FOUND" });
  const payment = await expireIfNeeded(paymentRaw);
  if (payment.status === "PAID") throw new HttpError(409, "A successful payment cannot be cancelled from the internship record", { code: "INTERNSHIP_PAYMENT_ALREADY_PAID" });

  let providerStatus = payment.cashfreeOrderId ? payment.cashfreeStatus : "CANCELLED";
  if (payment.cashfreeOrderId && payment.cashfreeStatus === "ACTIVE") {
    const order = await terminateCashfreeOrder(payment.cashfreeOrderId, randomUUID());
    providerStatus = order.order_status;
    if (order.order_status === "PAID") {
      const paid = await applyCashfreeOrderState(payment, order, await getCashfreeOrderPayments(order.order_id));
      if (paid.status === "PAID") throw new HttpError(409, "This payment completed while cancellation was being processed", { code: "INTERNSHIP_PAYMENT_ALREADY_PAID" });
    }
    if (!["TERMINATED", "TERMINATION_REQUESTED"].includes(order.order_status)) {
      throw new HttpError(502, "Cashfree did not confirm order cancellation. Refresh the payment status and retry.", { code: "CASHFREE_ORDER_TERMINATION_PENDING" });
    }
  }
  const saved = await prisma.internshipDocumentPayment.update({
    where: { id: payment.id },
    data: {
      status: "CANCELLED",
      cashfreeStatus: providerStatus,
      // Rotate both legacy link fields so every previously issued checkout URL is
      // invalid immediately, even for rows created before v2 tokens existed.
      cashfreeLinkId: revokedCheckoutLinkVersion(),
      cashfreeLinkUrl: revokedCheckoutUrl(),
    },
    select: paymentSelect,
  });
  await prisma.auditLog.create({
    data: { actorUserId, action: "internship.document_payment_cancelled", entityType: "CareerApplication", entityId: applicationId, metadata: { paymentId: payment.id, orderId: payment.cashfreeOrderId } },
  });
  return saved;
}

export async function refreshInternshipDocumentPayment(applicationId: string, actorUserId: string) {
  await ensureInternshipApplication(applicationId);
  const payment = await findPaymentByApplication(applicationId);
  if (!payment) throw new HttpError(404, "No hard-copy payment request exists for this internship", { code: "INTERNSHIP_PAYMENT_NOT_FOUND" });
  const saved = await refreshPayment(payment);
  await prisma.auditLog.create({
    data: { actorUserId, action: "internship.document_payment_status_refreshed", entityType: "CareerApplication", entityId: applicationId, metadata: { paymentId: payment.id, cashfreeStatus: saved.cashfreeStatus, orderId: saved.cashfreeOrderId } },
  });
  return saved;
}

export async function processCashfreePaymentWebhook(event: CashfreePaymentWebhook) {
  const taggedPaymentId = event.data.order.order_tags?.payment_id;
  const payment = taggedPaymentId
    ? await prisma.internshipDocumentPayment.findUnique({ where: { id: String(taggedPaymentId) }, select: paymentSelect })
    : await prisma.internshipDocumentPayment.findFirst({ where: { cashfreeOrderId: event.data.order.order_id }, select: paymentSelect });
  if (!payment) {
    logger.info("cashfree.webhook_unmatched_order", { paymentId: taggedPaymentId ? String(taggedPaymentId) : undefined, type: event.type, orderId: event.data.order.order_id });
    return { matched: false, paid: false };
  }
  const taggedCheckoutVersion = event.data.order.order_tags?.checkout_version;
  const currentStoredToken = storedCheckoutToken(payment.cashfreeLinkUrl);
  const currentLinkIsLegacy = Boolean(currentStoredToken && currentStoredToken.split(".").length === 2);
  const checkoutVersionMismatch = taggedCheckoutVersion
    ? String(taggedCheckoutVersion) !== payment.cashfreeLinkId
    : !currentLinkIsLegacy;
  if (!payment.cashfreeOrderId || payment.cashfreeOrderId !== event.data.order.order_id || checkoutVersionMismatch || payment.status === "CANCELLED") {
    logger.warn("cashfree.webhook_stale_order", {
      paymentId: payment.id,
      eventOrderId: event.data.order.order_id,
      currentOrderId: payment.cashfreeOrderId,
    });
    return { matched: true, paid: payment.status === "PAID" };
  }
  if (event.type !== "PAYMENT_SUCCESS_WEBHOOK" || event.data.payment.payment_status !== "SUCCESS") {
    return { matched: true, paid: payment.status === "PAID" };
  }

  const expected = payment.amountPaise;
  const orderAmount = toPaise(event.data.order.order_amount);
  const paidAmount = toPaise(event.data.payment.payment_amount);
  if (event.data.order.order_currency !== payment.currency || event.data.payment.payment_currency !== payment.currency || orderAmount !== expected || paidAmount < expected) {
    logger.error("cashfree.payment_mismatch", undefined, {
      paymentId: payment.id,
      orderId: event.data.order.order_id,
      expectedAmountPaise: expected,
      orderAmountPaise: orderAmount,
      paidAmountPaise: paidAmount,
      orderCurrency: event.data.order.order_currency,
      paymentCurrency: event.data.payment.payment_currency,
    });
    throw new HttpError(409, "Cashfree payment details do not match the amount issued by the admin", { code: "CASHFREE_PAYMENT_MISMATCH" });
  }
  const saved = await issueReceipt(payment, {
    orderId: event.data.order.order_id,
    transactionId: String(event.data.payment.cf_payment_id),
    amountPaidPaise: paidAmount,
    paidAt: event.data.payment.payment_time ?? event.event_time,
  });
  return { matched: true, paid: saved.status === "PAID" };
}

export async function getPaidInternshipDocumentReceipt(paymentId: string) {
  const payment = await prisma.internshipDocumentPayment.findUnique({ where: { id: paymentId }, select: paymentSelect });
  if (!payment || payment.status !== "PAID" || !payment.receiptNumber || !payment.paidAt) throw new HttpError(404, "Payment receipt not found", { code: "PAYMENT_RECEIPT_NOT_FOUND" });
  return payment;
}

export async function resendInternshipDocumentReceipt(applicationId: string, actorUserId: string) {
  await ensureInternshipApplication(applicationId);
  const payment = await findPaymentByApplication(applicationId);
  if (!payment || payment.status !== "PAID" || !payment.receiptNumber) throw new HttpError(409, "There is no completed payment receipt to resend", { code: "PAYMENT_RECEIPT_NOT_READY" });
  await prisma.internshipDocumentPayment.update({ where: { id: payment.id }, data: { receiptEmailStatus: "PENDING" } });
  const accepted = await deliverReceiptEmail(payment, randomUUID());
  await prisma.auditLog.create({ data: { actorUserId, action: "internship.document_payment_receipt_resent", entityType: "CareerApplication", entityId: applicationId, metadata: { paymentId: payment.id, accepted } } });
  return (await findPaymentByApplication(applicationId))!;
}
