import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { notifyInternshipDocumentPaymentCompleted, notifyInternshipDocumentPaymentLink } from "../../services/notification.service.js";
import { HttpError } from "../../utils/http-error.js";
import { logger } from "../../utils/logger.js";
import { cancelCashfreePaymentLink, createCashfreePaymentLink, fetchCashfreePaymentLink, getCashfreePaymentLinkOrders, type CashfreeLinkOrder, type CashfreePaymentLink } from "./cashfree.client.js";
import type { CashfreePaymentWebhook, CreateInternshipDocumentPayment } from "./internship-payments.schema.js";

const paymentSelect = {
  id: true,
  careerApplicationId: true,
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
  if (!/^\d{10}$/.test(digits)) throw new HttpError(400, "Cashfree payment links require a valid 10-digit Indian mobile number", { code: "CASHFREE_PHONE_INVALID" });
  return digits;
}

function cashfreeLinkId(requestKey: string) {
  return `zbh_intdoc_${requestKey.replaceAll("-", "").slice(0, 32)}`;
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

function receiptToken(paymentId: string) {
  return createHmac("sha256", env.JWT_SECRET).update(`internship-document-receipt:${paymentId}`).digest("hex");
}

export function internshipDocumentReceiptUrl(paymentId: string) {
  return publicUrl(`/api/backend/internship-payments/receipts/${encodeURIComponent(paymentId)}?token=${receiptToken(paymentId)}`);
}

export function verifyInternshipDocumentReceiptToken(paymentId: string, token: string) {
  const expected = Buffer.from(receiptToken(paymentId), "hex");
  let received: Buffer;
  try { received = Buffer.from(token, "hex"); } catch { return false; }
  return received.length === expected.length && timingSafeEqual(received, expected);
}

async function findPaymentByApplication(careerApplicationId: string) {
  return prisma.internshipDocumentPayment.findUnique({ where: { careerApplicationId }, select: paymentSelect });
}

export async function getInternshipDocumentPayment(careerApplicationId: string) {
  const payment = await findPaymentByApplication(careerApplicationId);
  if (!payment) return null;
  return {
    ...payment,
    receiptUrl: payment.status === "PAID" && payment.receiptNumber ? internshipDocumentReceiptUrl(payment.id) : null,
  };
}

async function ensureInternshipApplication(applicationId: string) {
  const application = await prisma.careerApplication.findFirst({
    where: { id: applicationId, applicationType: "INTERNSHIP" },
    select: { id: true, fullName: true, email: true, phone: true, status: true },
  });
  if (!application) throw new HttpError(404, "Internship application not found", { code: "INTERNSHIP_APPLICATION_NOT_FOUND" });
  if (application.status === "REJECTED") throw new HttpError(409, "A hard-copy payment link cannot be issued for a rejected internship application", { code: "INTERNSHIP_PAYMENT_NOT_ELIGIBLE" });
  return application;
}

function paidOrder(orders: CashfreeLinkOrder[]) {
  return orders.find(order => order.order_status === "PAID") ?? orders.find(order => order.transaction_id != null) ?? orders[0];
}

async function deliverReceiptEmail(payment: NonNullable<PaymentRecord>, deliveryAttempt = "automatic") {
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

async function issueReceipt(payment: NonNullable<PaymentRecord>, order?: CashfreeLinkOrder, eventTime?: string) {
  if (payment.status === "PAID" && payment.receiptNumber) return payment;
  const amountPaidPaise = payment.amountPaidPaise ?? payment.amountPaise;
  const paidAt = eventTime && !Number.isNaN(Date.parse(eventTime)) ? new Date(eventTime) : new Date();
  const number = payment.receiptNumber ?? receiptNumber(payment.id, paidAt);
  const changed = await prisma.internshipDocumentPayment.updateMany({
    where: { id: payment.id, status: { not: "PAID" } },
    data: {
      status: "PAID",
      cashfreeStatus: "PAID",
      amountPaidPaise,
      cashfreeOrderId: order?.order_id ?? payment.cashfreeOrderId,
      cashfreeTransactionId: order?.transaction_id != null ? String(order.transaction_id) : payment.cashfreeTransactionId,
      paidAt,
      receiptNumber: number,
      receiptIssuedAt: new Date(),
      receiptEmailStatus: "PENDING",
    },
  });
  const saved = await prisma.internshipDocumentPayment.findUnique({ where: { id: payment.id }, select: paymentSelect });
  if (!saved) throw new HttpError(404, "Document payment record not found", { code: "INTERNSHIP_PAYMENT_NOT_FOUND" });
  if (changed.count === 1) {
    await prisma.auditLog.create({ data: { action: "internship.document_payment_paid", entityType: "CareerApplication", entityId: saved.careerApplicationId, metadata: { paymentId: saved.id, amountPaise: saved.amountPaidPaise, receiptNumber: saved.receiptNumber, transactionId: saved.cashfreeTransactionId } } });
    void deliverReceiptEmail(saved).catch(error => logger.warn("internship.document_receipt_email_failed", { paymentId: saved.id, reason: error instanceof Error ? error.message : "unknown" }));
  }
  return saved;
}

async function applyCashfreeState(payment: NonNullable<PaymentRecord>, provider: CashfreePaymentLink, order?: CashfreeLinkOrder, eventTime?: string) {
  const expected = payment.amountPaise;
  const providerAmount = toPaise(provider.link_amount);
  const paidAmount = toPaise(provider.link_amount_paid);
  if (provider.link_currency !== payment.currency || providerAmount !== expected) {
    logger.error("cashfree.payment_mismatch", undefined, { paymentId: payment.id, linkId: payment.cashfreeLinkId, expectedAmountPaise: expected, providerAmountPaise: providerAmount, expectedCurrency: payment.currency, providerCurrency: provider.link_currency });
    throw new HttpError(409, "Cashfree payment details do not match the amount issued by the admin", { code: "CASHFREE_PAYMENT_MISMATCH" });
  }
  if (provider.link_status === "PAID") {
    if (paidAmount < expected) throw new HttpError(409, "Cashfree reports the link as paid but the collected amount is incomplete", { code: "CASHFREE_PAYMENT_INCOMPLETE" });
    const withAmount = { ...payment, amountPaidPaise: paidAmount || expected };
    return issueReceipt(withAmount, order, eventTime);
  }
  const mapped = provider.link_status === "EXPIRED" ? "EXPIRED" : provider.link_status === "CANCELLED" ? "CANCELLED" : "ACTIVE";
  await prisma.internshipDocumentPayment.update({
    where: { id: payment.id },
    data: { cashfreeStatus: provider.link_status, status: mapped, amountPaidPaise: paidAmount || null },
  });
  return (await prisma.internshipDocumentPayment.findUnique({ where: { id: payment.id }, select: paymentSelect }))!;
}

export async function createInternshipDocumentPayment(applicationId: string, actorUserId: string, input: CreateInternshipDocumentPayment) {
  const application = await ensureInternshipApplication(applicationId);
  const priorByKey = await prisma.internshipDocumentPayment.findUnique({ where: { requestKey: input.requestKey }, select: paymentSelect });
  if (priorByKey) {
    if (priorByKey.careerApplicationId !== applicationId) throw new HttpError(409, "This payment request key is already used", { code: "PAYMENT_REQUEST_KEY_REUSED" });
    return priorByKey;
  }
  const existing = await findPaymentByApplication(applicationId);
  if (existing?.status === "PAID") throw new HttpError(409, "This hard-copy request is already paid", { code: "INTERNSHIP_PAYMENT_ALREADY_PAID" });
  if (existing?.status === "ACTIVE") throw new HttpError(409, "An active payment link already exists. Cancel it before creating a replacement.", { code: "INTERNSHIP_PAYMENT_LINK_ACTIVE" });

  const customerPhone = normalizeCashfreePhone(input.customerPhone);
  const amountPaise = Math.round(input.amountRupees * 100);
  const linkId = cashfreeLinkId(input.requestKey);
  const expiresAt = new Date(Date.now() + input.expiryDays * 24 * 60 * 60_000);
  const paymentId = existing?.id ?? randomUUID();
  const provider = await createCashfreePaymentLink({
    linkId,
    amountRupees: amountPaise / 100,
    purpose: `Printing and courier charges - ${input.documentDescription}`.slice(0, 500),
    customerName: input.recipientName,
    customerEmail: input.customerEmail,
    customerPhone,
    expiresAt,
    notifyUrl: publicUrl("/api/backend/payments/cashfree/webhook"),
    requestKey: input.requestKey,
    notes: { application_id: applicationId.slice(0, 50), payment_id: paymentId.slice(0, 50) },
  });
  if (!provider.link_url || !/^https:\/\//i.test(provider.link_url)) throw new HttpError(502, "Cashfree did not return a secure payment link", { code: "CASHFREE_LINK_INVALID" });
  if (provider.cf_link_id == null || String(provider.cf_link_id).trim() === "") throw new HttpError(502, "Cashfree did not return a link reference required for payment confirmation", { code: "CASHFREE_LINK_REFERENCE_MISSING" });

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
    cashfreeLinkId: provider.link_id,
    cashfreeCfLinkId: String(provider.cf_link_id),
    cashfreeLinkUrl: provider.link_url,
    cashfreeStatus: provider.link_status,
    linkExpiresAt: provider.link_expiry_time ? new Date(provider.link_expiry_time) : expiresAt,
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
  await prisma.auditLog.create({ data: { actorUserId, action: "internship.document_payment_link_created", entityType: "CareerApplication", entityId: applicationId, metadata: { paymentId: saved.id, amountPaise, linkId: saved.cashfreeLinkId, documentDescription: saved.documentDescription } } });
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

export async function cancelInternshipDocumentPayment(applicationId: string, actorUserId: string) {
  await ensureInternshipApplication(applicationId);
  const payment = await findPaymentByApplication(applicationId);
  if (!payment) throw new HttpError(404, "No hard-copy payment link exists for this internship", { code: "INTERNSHIP_PAYMENT_NOT_FOUND" });
  if (payment.status === "PAID") throw new HttpError(409, "A successful payment cannot be cancelled from the internship record", { code: "INTERNSHIP_PAYMENT_ALREADY_PAID" });
  if (payment.status === "ACTIVE") await cancelCashfreePaymentLink(payment.cashfreeLinkId, randomUUID());
  const saved = await prisma.internshipDocumentPayment.update({ where: { id: payment.id }, data: { status: "CANCELLED", cashfreeStatus: "CANCELLED" }, select: paymentSelect });
  await prisma.auditLog.create({ data: { actorUserId, action: "internship.document_payment_link_cancelled", entityType: "CareerApplication", entityId: applicationId, metadata: { paymentId: payment.id, linkId: payment.cashfreeLinkId } } });
  return saved;
}

export async function refreshInternshipDocumentPayment(applicationId: string, actorUserId: string) {
  await ensureInternshipApplication(applicationId);
  const payment = await findPaymentByApplication(applicationId);
  if (!payment) throw new HttpError(404, "No hard-copy payment link exists for this internship", { code: "INTERNSHIP_PAYMENT_NOT_FOUND" });
  const provider = await fetchCashfreePaymentLink(payment.cashfreeLinkId);
  const orders = provider.link_status === "PAID" ? await getCashfreePaymentLinkOrders(payment.cashfreeLinkId) : [];
  const saved = await applyCashfreeState(payment, provider, paidOrder(orders));
  await prisma.auditLog.create({ data: { actorUserId, action: "internship.document_payment_status_refreshed", entityType: "CareerApplication", entityId: applicationId, metadata: { paymentId: payment.id, cashfreeStatus: provider.link_status } } });
  return saved;
}

export async function processCashfreePaymentWebhook(event: CashfreePaymentWebhook) {
  const cfLinkId = event.data.order.order_tags?.cf_link_id;
  if (!cfLinkId) {
    logger.info("cashfree.webhook_without_link", { type: event.type, orderId: event.data.order.order_id });
    return { matched: false, paid: false };
  }
  const payment = await prisma.internshipDocumentPayment.findUnique({ where: { cashfreeCfLinkId: String(cfLinkId) }, select: paymentSelect });
  if (!payment) {
    logger.info("cashfree.webhook_unmatched_link", { cfLinkId: String(cfLinkId), type: event.type, orderId: event.data.order.order_id });
    return { matched: false, paid: false };
  }
  if (event.type !== "PAYMENT_SUCCESS_WEBHOOK" || event.data.payment.payment_status !== "SUCCESS") {
    return { matched: true, paid: payment.status === "PAID" };
  }

  const provider: CashfreePaymentLink = {
    link_id: payment.cashfreeLinkId,
    link_status: "PAID",
    link_currency: event.data.order.order_currency,
    link_amount: event.data.order.order_amount,
    link_amount_paid: event.data.payment.payment_amount,
    link_url: payment.cashfreeLinkUrl,
  };
  if (event.data.payment.payment_currency !== payment.currency) {
    logger.error("cashfree.payment_currency_mismatch", undefined, { paymentId: payment.id, paymentCurrency: event.data.payment.payment_currency, expectedCurrency: payment.currency });
    throw new HttpError(409, "Cashfree payment currency does not match the issued link", { code: "CASHFREE_PAYMENT_MISMATCH" });
  }
  const saved = await applyCashfreeState(payment, provider, {
    order_id: event.data.order.order_id,
    order_status: "PAID",
    order_amount: event.data.order.order_amount,
    transaction_id: event.data.payment.cf_payment_id,
  }, event.data.payment.payment_time ?? event.event_time);
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
