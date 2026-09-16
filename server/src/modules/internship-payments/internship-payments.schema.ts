import { z } from "zod";

const text = (max: number) => z.string().trim().min(2).max(max);
const optionalText = (max: number) => z.string().trim().max(max).default("");

export const createInternshipDocumentPaymentSchema = z.object({
  requestKey: z.uuid(),
  recipientName: text(120),
  customerEmail: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  customerPhone: z.string().trim().regex(/^\+?[\d ()-]{10,24}$/, "Enter a valid mobile number"),
  documentDescription: text(240),
  addressLine1: text(220),
  addressLine2: optionalText(220),
  city: text(120),
  state: text(120),
  postalCode: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9 -]{2,11}$/, "Enter a valid postal code"),
  courierNote: optionalText(1000),
  amountRupees: z.number().min(1).max(100_000).refine(value => Math.abs(Math.round(value * 100) - value * 100) < 1e-8, "Use at most two decimal places"),
  expiryDays: z.number().int().min(1).max(30).default(7),
}).strict();

const amount = z.union([z.number(), z.string()]).transform(value => Number(value)).refine(Number.isFinite, "Invalid amount");
const stringish = z.union([z.string(), z.number()]).transform(String);

export const cashfreePaymentWebhookSchema = z.object({
  type: z.enum(["PAYMENT_SUCCESS_WEBHOOK", "PAYMENT_FAILED_WEBHOOK", "PAYMENT_USER_DROPPED_WEBHOOK"]),
  event_time: z.string().optional(),
  data: z.object({
    order: z.object({
      order_id: z.string().min(1),
      order_amount: amount,
      order_currency: z.string().min(3).max(8),
      order_tags: z.object({ payment_id: stringish.optional(), application_id: stringish.optional() }).passthrough().nullable().optional(),
    }).passthrough(),
    payment: z.object({
      cf_payment_id: stringish,
      payment_status: z.string().min(1),
      payment_amount: amount,
      payment_currency: z.string().min(3).max(8),
      payment_time: z.string().optional(),
    }).passthrough(),
  }).passthrough(),
}).passthrough();

export const checkoutParamsSchema = z.object({
  token: z.string().trim().min(76).max(180).regex(/^[A-Za-z0-9._-]+$/, "Invalid payment token"),
}).strict();

export const receiptParamsSchema = z.object({ id: z.string().trim().min(10).max(100) }).strict();
export const receiptQuerySchema = z.object({ token: z.string().trim().max(90).regex(/^\d{10,12}\.[a-f0-9]{64}$/i, "Invalid receipt token") }).strict();

export type CreateInternshipDocumentPayment = z.infer<typeof createInternshipDocumentPaymentSchema>;
export type CashfreePaymentWebhook = z.infer<typeof cashfreePaymentWebhookSchema>;
