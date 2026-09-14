import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { HttpError } from "../../utils/http-error.js";
import { logger } from "../../utils/logger.js";
import { cashfreePaymentWebhookSchema, checkoutParamsSchema, receiptParamsSchema, receiptQuerySchema } from "./internship-payments.schema.js";
import { getPaidInternshipDocumentReceipt, getPublicInternshipDocumentPayment, processCashfreePaymentWebhook, refreshPublicInternshipDocumentPayment, startPublicInternshipDocumentCheckout, verifyInternshipDocumentReceiptToken } from "./internship-payments.service.js";
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
:root{font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;color:#21191c;background:#f3f3f3}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;padding:24px 16px;background:#f3f3f3}
.sheet{width:min(100%,900px);margin:0 auto;background:#fff;border:1px solid #d5d0d2;border-top:5px solid #a31334;box-shadow:0 8px 24px rgba(35,24,28,.06)}
.header{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding:22px 26px 18px;border-bottom:1px solid #ddd8da}
.brand{font-size:24px;font-weight:900;letter-spacing:.09em;color:#a31334}
.eyebrow{margin-top:6px;color:#74666b;font-size:9.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.status{padding:7px 10px;border:1px solid #bad1c1;border-left:4px solid #267249;background:#f7faf8;color:#245c3b;font-size:9.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.summary{display:grid;grid-template-columns:minmax(0,1fr) 240px;gap:24px;align-items:end;padding:20px 26px;border-bottom:1px solid #ddd8da}
.summary h1{margin:0;color:#21191c;font-size:25px;line-height:1.15;letter-spacing:-.025em}
.summary p{margin:6px 0 0;color:#74676c;font-size:11px;line-height:1.45}
.amount{text-align:right}
.amount-label{display:block;margin-bottom:4px;color:#74676c;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
.amount strong{display:block;color:#a31334;font-size:31px;line-height:1;font-weight:900;letter-spacing:-.03em}
.receipt-no{margin-top:7px;color:#74676c;font-size:9.5px}
.receipt-no b{color:#2a2024;overflow-wrap:anywhere}
.details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-bottom:1px solid #ddd8da}
.field{min-width:0;padding:13px 26px;border-bottom:1px solid #ebe7e8}
.field:nth-child(odd){border-right:1px solid #ebe7e8}
.field.full{grid-column:1/-1;border-right:0}
.field dt{margin:0 0 4px;color:#7d6d73;font-size:9px;font-weight:800;letter-spacing:.075em;text-transform:uppercase}
.field dd{margin:0;color:#21191c;font-size:12.5px;font-weight:700;line-height:1.4;overflow-wrap:anywhere}
.field.mono dd{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.5px;font-weight:650;color:#493b40}
.footer{padding:14px 26px 17px}
.note{margin:0;color:#6f6267;font-size:10px;line-height:1.55}
.print{margin:10px 0 0;padding-top:10px;border-top:1px solid #ebe7e8;color:#8a7c81;font-size:9px}
@media(max-width:640px){
  body{padding:8px}
  .header{padding:16px 14px 13px;gap:12px}
  .brand{font-size:20px}
  .status{padding:6px 8px;font-size:8.5px}
  .summary{grid-template-columns:1fr;gap:13px;padding:15px 14px}
  .summary h1{font-size:21px}
  .amount{text-align:left}
  .amount strong{font-size:27px}
  .details{grid-template-columns:1fr}
  .field,.field:nth-child(odd){padding:11px 14px;border-right:0}
  .field.full{grid-column:auto}
  .footer{padding:13px 14px 15px}
}
@media print{
  body{padding:0;background:#fff}
  .sheet{width:100%;max-width:none;border:1px solid #aaa;border-top:4px solid #000;box-shadow:none}
  .brand,.amount strong{color:#000}
  .print{display:none}
}
</style></head><body><main class="sheet">
<header class="header">
  <div><div class="brand">ZOBHUNGER</div><div class="eyebrow">Internship document payment receipt</div></div>
  <div class="status">Payment confirmed</div>
</header>
<section class="summary">
  <div><h1>Printing &amp; courier payment receipt</h1><p>Confirmation of payment for the requested internship document printing and dispatch service.</p></div>
  <div class="amount">
    <span class="amount-label">Amount received</span>
    <strong>${escapeHtml(inr(payment.amountPaidPaise ?? payment.amountPaise))}</strong>
    <div class="receipt-no">Receipt <b>${escapeHtml(payment.receiptNumber)}</b></div>
  </div>
</section>
<dl class="details">
  <div class="field"><dt>Recipient</dt><dd>${escapeHtml(payment.recipientName)}</dd></div>
  <div class="field"><dt>Paid on</dt><dd>${escapeHtml(dateTime(payment.paidAt!))}</dd></div>
  <div class="field"><dt>Email</dt><dd>${escapeHtml(payment.customerEmail)}</dd></div>
  <div class="field"><dt>Document</dt><dd>${escapeHtml(payment.documentDescription)}</dd></div>
  ${payment.cashfreeTransactionId ? `<div class="field mono"><dt>Cashfree payment ID</dt><dd>${escapeHtml(payment.cashfreeTransactionId)}</dd></div>` : ""}
  ${payment.cashfreeOrderId ? `<div class="field mono"><dt>Cashfree order ID</dt><dd>${escapeHtml(payment.cashfreeOrderId)}</dd></div>` : ""}
  <div class="field full"><dt>Delivery address</dt><dd>${escapeHtml(address)}</dd></div>
</dl>
<footer class="footer">
  <p class="note">This receipt confirms payment for printing and courier charges for the requested internship document. It is not a GST tax invoice unless a separate tax invoice is issued by the company accounts team.</p>
  <p class="print">Print this page or use your browser's Save as PDF option for a copy.</p>
</footer>
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
internshipPaymentPublicRouter.use((_req, res, next) => {
  res.set({ "Cache-Control": "private, no-store, max-age=0, must-revalidate", "X-Robots-Tag": "noindex, nofollow, noarchive" });
  next();
});

internshipPaymentPublicRouter.get("/checkout/:token", validate({ params: checkoutParamsSchema }), async (_req, res) => {
  const payment = await getPublicInternshipDocumentPayment(res.locals.validated.params.token);
  res.json(apiSuccessResponse("Payment request", { payment }));
});

internshipPaymentPublicRouter.post("/checkout/:token/order", validate({ params: checkoutParamsSchema }), async (_req, res) => {
  const checkout = await startPublicInternshipDocumentCheckout(res.locals.validated.params.token);
  res.json(apiSuccessResponse("Secure checkout ready", { checkout }));
});

internshipPaymentPublicRouter.post("/checkout/:token/refresh", validate({ params: checkoutParamsSchema }), async (_req, res) => {
  const payment = await refreshPublicInternshipDocumentPayment(res.locals.validated.params.token);
  res.json(apiSuccessResponse("Payment status refreshed", { payment }));
});
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
