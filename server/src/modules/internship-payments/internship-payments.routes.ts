import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { HttpError } from "../../utils/http-error.js";
import { logger } from "../../utils/logger.js";
import { cashfreePaymentWebhookSchema, receiptParamsSchema, receiptQuerySchema } from "./internship-payments.schema.js";
import { getPaidInternshipDocumentReceipt, processCashfreePaymentWebhook, verifyInternshipDocumentReceiptToken } from "./internship-payments.service.js";
import { verifyCashfreeWebhook } from "./cashfree.client.js";

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inr(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
}

function dateTime(value: Date) {
  return value.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
}

function receiptHtml(payment: Awaited<ReturnType<typeof getPaidInternshipDocumentReceipt>>) {
  const address = [payment.addressLine1, payment.addressLine2, payment.city, payment.state, payment.postalCode].filter(Boolean).join(", ");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(payment.receiptNumber)} | ZOBHUNGER</title>
<style>
:root{font-family:Arial,Helvetica,sans-serif;color:#251920;background:#f5f2f3}*{box-sizing:border-box}body{margin:0;padding:32px 16px}.sheet{max-width:820px;margin:auto;background:#fff;border:1px solid #e5d9df;border-radius:20px;padding:36px;box-shadow:0 18px 55px #32121b12}.brand{font-size:25px;font-weight:800;letter-spacing:.08em;color:#b31638}.eyebrow{margin-top:24px;font-size:12px;font-weight:800;letter-spacing:.14em;color:#965469}.row{display:grid;grid-template-columns:180px 1fr;gap:12px;border-top:1px solid #eee4e8;padding:14px 0}.row span:first-child{color:#7f6d75;font-size:13px}.row strong{font-size:14px;overflow-wrap:anywhere}.paid{display:inline-block;margin:18px 0;padding:8px 12px;border-radius:999px;background:#ebf7ef;color:#24613e;font-weight:800;font-size:12px}.total{margin:24px 0;padding:18px;border-radius:14px;background:#fff5f7;border:1px solid #ebc8d2;display:flex;justify-content:space-between;align-items:center}.total strong{font-size:24px;color:#9f1737}.note{margin-top:24px;color:#75666d;font-size:12px;line-height:1.65}.print{margin-top:24px;padding-top:16px;border-top:1px solid #eee4e8;font-size:12px;color:#7f6d75}@media(max-width:600px){.sheet{padding:24px}.row{grid-template-columns:1fr}.total{align-items:flex-start;gap:8px;flex-direction:column}}@media print{body{background:#fff;padding:0}.sheet{box-shadow:none;border:0;border-radius:0;max-width:none}.print{display:none}}
</style></head><body><main class="sheet">
<div class="brand">ZOBHUNGER</div><div class="eyebrow">PAYMENT RECEIPT · INTERNSHIP DOCUMENTS</div><h1>Printing & courier payment receipt</h1><span class="paid">PAYMENT CONFIRMED</span>
<div class="row"><span>Receipt number</span><strong>${escapeHtml(payment.receiptNumber)}</strong></div>
<div class="row"><span>Recipient</span><strong>${escapeHtml(payment.recipientName)}</strong></div>
<div class="row"><span>Email</span><strong>${escapeHtml(payment.customerEmail)}</strong></div>
<div class="row"><span>Document</span><strong>${escapeHtml(payment.documentDescription)}</strong></div>
<div class="row"><span>Paid on</span><strong>${escapeHtml(dateTime(payment.paidAt!))}</strong></div>
${payment.cashfreeTransactionId ? `<div class="row"><span>Cashfree payment ID</span><strong>${escapeHtml(payment.cashfreeTransactionId)}</strong></div>` : ""}
${payment.cashfreeOrderId ? `<div class="row"><span>Cashfree order</span><strong>${escapeHtml(payment.cashfreeOrderId)}</strong></div>` : ""}
<div class="row"><span>Delivery address</span><strong>${escapeHtml(address)}</strong></div>
<div class="total"><span>Amount received</span><strong>${escapeHtml(inr(payment.amountPaidPaise ?? payment.amountPaise))}</strong></div>
<p class="note">This electronic receipt confirms payment for printing and courier charges for the requested internship document. It is not a GST tax invoice unless a separate tax invoice is issued by the company accounts team.</p>
<p class="print">Use your browser’s Print command to print this receipt or save it as a PDF.</p>
</main></body></html>`;
}

export const cashfreeWebhookRouter = Router();
cashfreeWebhookRouter.post("/", async (req, res) => {
  if (!Buffer.isBuffer(req.body)) throw new HttpError(400, "Cashfree webhook body must be raw JSON", { code: "CASHFREE_WEBHOOK_BODY_INVALID" });
  const timestamp = req.get("x-webhook-timestamp");
  const signature = req.get("x-webhook-signature");
  if (!verifyCashfreeWebhook(req.body, timestamp, signature)) throw new HttpError(401, "Invalid Cashfree webhook signature", { code: "CASHFREE_WEBHOOK_SIGNATURE_INVALID" });
  let payload: unknown;
  try { payload = JSON.parse(req.body.toString("utf8")); } catch { throw new HttpError(400, "Invalid Cashfree webhook JSON", { code: "CASHFREE_WEBHOOK_JSON_INVALID" }); }
  const parsed = cashfreePaymentWebhookSchema.safeParse(payload);
  if (!parsed.success) throw new HttpError(400, "Unsupported Cashfree payment webhook", { code: "CASHFREE_WEBHOOK_UNSUPPORTED" });
  const result = await processCashfreePaymentWebhook(parsed.data);
  logger.info("cashfree.webhook_processed", { requestId: res.locals.requestId, orderId: parsed.data.data.order.order_id, type: parsed.data.type, matched: result.matched, paid: result.paid });
  res.status(200).json({ ok: true });
});

export const internshipPaymentPublicRouter = Router();
internshipPaymentPublicRouter.get("/receipts/:id", validate({ params: receiptParamsSchema, query: receiptQuerySchema }), async (_req, res) => {
  const { id } = res.locals.validated.params;
  const { token } = res.locals.validated.query;
  if (!verifyInternshipDocumentReceiptToken(id, token)) throw new HttpError(404, "Payment receipt not found", { code: "PAYMENT_RECEIPT_NOT_FOUND" });
  const payment = await getPaidInternshipDocumentReceipt(id);
  res.set({
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "Referrer-Policy": "no-referrer",
    "Content-Type": "text/html; charset=utf-8",
  });
  res.send(receiptHtml(payment));
});
