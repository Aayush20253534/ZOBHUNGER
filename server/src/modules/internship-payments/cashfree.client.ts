import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { HttpError } from "../../utils/http-error.js";
import { logger } from "../../utils/logger.js";

export interface CashfreeOrder {
  cf_order_id?: string | number;
  order_id: string;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED" | string;
  order_currency: string;
  order_amount: number;
  payment_session_id?: string;
  order_expiry_time?: string;
}

export interface CashfreeOrderPayment {
  cf_payment_id?: string | number;
  payment_status?: string;
  payment_amount?: number;
  payment_currency?: string;
  payment_time?: string;
}

function configuration() {
  if (!env.CASHFREE_ENABLED || !env.CASHFREE_CLIENT_ID || !env.CASHFREE_CLIENT_SECRET) {
    throw new HttpError(503, "Cashfree checkout is not configured yet", { code: "CASHFREE_NOT_CONFIGURED" });
  }
  return {
    clientId: env.CASHFREE_CLIENT_ID,
    clientSecret: env.CASHFREE_CLIENT_SECRET,
    baseUrl: env.CASHFREE_ENVIRONMENT === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg",
  };
}

export function cashfreeCheckoutEnvironment() {
  configuration();
  return env.CASHFREE_ENVIRONMENT;
}

async function responseMessage(response: Response) {
  try {
    const body = await response.json() as { message?: unknown; type?: unknown; code?: unknown };
    const message = typeof body.message === "string" ? body.message : "Cashfree rejected the payment request";
    return {
      message: message.slice(0, 300),
      type: typeof body.type === "string" ? body.type : undefined,
      code: typeof body.code === "string" ? body.code : undefined,
    };
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
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(env.CASHFREE_TIMEOUT_MS),
    });
    if (!response.ok) {
      const detail = await responseMessage(response);
      logger.warn("cashfree.api_error", {
        path,
        status: response.status,
        providerCode: detail.code,
        providerType: detail.type,
        providerMessage: detail.message,
      });
      throw new HttpError(response.status === 429 ? 503 : 502, detail.message, {
        code: "CASHFREE_API_ERROR",
        details: { status: response.status, providerCode: detail.code, providerType: detail.type },
      });
    }
    return await response.json() as T;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    logger.warn("cashfree.request_failed", { path, reason: error instanceof Error ? error.message : "unknown" });
    throw new HttpError(503, "Cashfree is temporarily unavailable. Please retry the payment action.", { code: "CASHFREE_UNAVAILABLE" });
  }
}

export function createCashfreeOrder(input: {
  orderId: string;
  amountRupees: number;
  purpose: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  expiresAt: Date;
  returnUrl: string;
  notifyUrl: string;
  requestKey: string;
  tags: Record<string, string>;
}) {
  return cashfreeFetch<CashfreeOrder>("/orders", {
    method: "POST",
    idempotencyKey: input.requestKey,
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: input.amountRupees,
      order_currency: "INR",
      customer_details: {
        customer_id: input.customerId,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone,
      },
      order_meta: {
        return_url: input.returnUrl,
        notify_url: input.notifyUrl,
      },
      order_expiry_time: input.expiresAt.toISOString(),
      order_note: input.purpose.slice(0, 180),
      order_tags: input.tags,
    }),
  });
}

export function fetchCashfreeOrder(orderId: string) {
  return cashfreeFetch<CashfreeOrder>(`/orders/${encodeURIComponent(orderId)}`);
}

export async function getCashfreeOrderPayments(orderId: string) {
  const result = await cashfreeFetch<unknown>(`/orders/${encodeURIComponent(orderId)}/payments`);
  if (Array.isArray(result)) return result as CashfreeOrderPayment[];
  if (result && typeof result === "object" && "payments" in result && Array.isArray((result as { payments?: unknown }).payments)) {
    return (result as { payments: CashfreeOrderPayment[] }).payments;
  }
  return [];
}

export function terminateCashfreeOrder(orderId: string, requestKey: string) {
  return cashfreeFetch<CashfreeOrder>(`/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    idempotencyKey: requestKey,
    body: JSON.stringify({ order_status: "TERMINATED" }),
  });
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
