import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { HttpError } from "../../utils/http-error.js";
import { logger } from "../../utils/logger.js";

export interface CashfreePaymentLink {
  cf_link_id?: string | number;
  link_id: string;
  link_status: "ACTIVE" | "PAID" | "PARTIALLY_PAID" | "EXPIRED" | "CANCELLED";
  link_currency: string;
  link_amount: number;
  link_amount_paid?: number;
  link_url: string;
  link_expiry_time?: string;
}

export interface CashfreeLinkOrder {
  order_id?: string;
  order_status?: string;
  order_amount?: number;
  transaction_id?: string | number;
}

function configuration() {
  if (!env.CASHFREE_ENABLED || !env.CASHFREE_CLIENT_ID || !env.CASHFREE_CLIENT_SECRET) {
    throw new HttpError(503, "Cashfree payment links are not configured yet", { code: "CASHFREE_NOT_CONFIGURED" });
  }
  return {
    clientId: env.CASHFREE_CLIENT_ID,
    clientSecret: env.CASHFREE_CLIENT_SECRET,
    baseUrl: env.CASHFREE_ENVIRONMENT === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg",
  };
}

async function responseMessage(response: Response) {
  try {
    const body = await response.json() as { message?: unknown; type?: unknown; code?: unknown };
    const message = typeof body.message === "string" ? body.message : "Cashfree rejected the payment request";
    return { message: message.slice(0, 300), type: typeof body.type === "string" ? body.type : undefined, code: typeof body.code === "string" ? body.code : undefined };
  } catch {
    return { message: `Cashfree returned HTTP ${response.status}` };
  }
}

async function cashfreeFetch<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const { clientId, clientSecret, baseUrl } = configuration();
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  headers.set("x-api-version", env.CASHFREE_API_VERSION);
  headers.set("x-client-id", clientId);
  headers.set("x-client-secret", clientSecret);
  headers.set("x-request-id", randomUUID());
  if (init.body) headers.set("content-type", "application/json");
  if (init.idempotencyKey) headers.set("x-idempotency-key", init.idempotencyKey);
  try {
    const response = await fetch(`${baseUrl}${path}`, { ...init, headers, signal: AbortSignal.timeout(env.CASHFREE_TIMEOUT_MS) });
    if (!response.ok) {
      const detail = await responseMessage(response);
      throw new HttpError(response.status === 429 ? 503 : 502, detail.message, { code: "CASHFREE_API_ERROR", details: { status: response.status, providerCode: detail.code, providerType: detail.type } });
    }
    return await response.json() as T;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    logger.warn("cashfree.request_failed", { path, reason: error instanceof Error ? error.message : "unknown" });
    throw new HttpError(503, "Cashfree is temporarily unavailable. Please retry the payment-link action.", { code: "CASHFREE_UNAVAILABLE" });
  }
}

export function createCashfreePaymentLink(input: {
  linkId: string;
  amountRupees: number;
  purpose: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  expiresAt: Date;
  notifyUrl: string;
  requestKey: string;
  notes: Record<string, string>;
}) {
  return cashfreeFetch<CashfreePaymentLink>("/links", {
    method: "POST",
    idempotencyKey: input.requestKey,
    body: JSON.stringify({
      link_id: input.linkId,
      link_amount: input.amountRupees,
      link_currency: "INR",
      link_purpose: input.purpose,
      link_partial_payments: false,
      link_expiry_time: input.expiresAt.toISOString(),
      link_auto_reminders: true,
      customer_details: {
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone,
      },
      link_notify: { send_sms: true, send_email: true, send_whatsapp: false },
      link_meta: { notify_url: input.notifyUrl },
      link_notes: input.notes,
      enable_invoice: true,
    }),
  });
}

export function fetchCashfreePaymentLink(linkId: string) {
  return cashfreeFetch<CashfreePaymentLink>(`/links/${encodeURIComponent(linkId)}`);
}

export async function cancelCashfreePaymentLink(linkId: string, requestKey: string) {
  return cashfreeFetch<CashfreePaymentLink>(`/links/${encodeURIComponent(linkId)}/cancel`, { method: "POST", idempotencyKey: requestKey });
}

export async function getCashfreePaymentLinkOrders(linkId: string) {
  const result = await cashfreeFetch<unknown>(`/links/${encodeURIComponent(linkId)}/orders`);
  if (Array.isArray(result)) return result as CashfreeLinkOrder[];
  if (result && typeof result === "object" && "orders" in result && Array.isArray((result as { orders?: unknown }).orders)) return (result as { orders: CashfreeLinkOrder[] }).orders;
  return [];
}

export function verifyCashfreeWebhook(rawBody: Buffer, timestamp: string | undefined, signature: string | undefined) {
  if (!env.CASHFREE_ENABLED || !env.CASHFREE_CLIENT_SECRET || !timestamp || !signature) return false;
  if (!/^\d{10,16}$/.test(timestamp)) return false;
  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(Date.now() - sentAt) > 5 * 60_000 + 30_000) return false;
  const expected = createHmac("sha256", env.CASHFREE_CLIENT_SECRET).update(timestamp).update(rawBody).digest();
  let received: Buffer;
  try { received = Buffer.from(signature, "base64"); } catch { return false; }
  return received.length === expected.length && timingSafeEqual(received, expected);
}
