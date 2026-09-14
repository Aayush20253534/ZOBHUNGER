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
:root{font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;color:#24181d;background:#f6f3f4}*{box-sizing:border-box}body{margin:0;min-height:100vh;padding:20px;display:grid;place-items:center;background:radial-gradient(circle at top left,#fff 0,#f8f4f5 36%,#f2edef 100%)}.sheet{width:min(100%,720px);background:#fff;border:1px solid #eadde2;border-radius:18px;padding:24px;box-shadow:0 18px 55px rgba(70,25,40,.09)}.top{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding-bottom:18px;border-bottom:1px solid #efe5e8}.brand{font-size:23px;font-weight:900;letter-spacing:.09em;color:#b31638}.eyebrow{margin-top:5px;font-size:10px;font-weight:800;letter-spacing:.15em;color:#986071}.paid{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid #cce7d5;border-radius:999px;background:#eef8f1;color:#176139;font-size:10px;font-weight:900;letter-spacing:.06em;white-space:nowrap}.paid:before{content:"";width:7px;height:7px;border-radius:50%;background:#2a8d55;box-shadow:0 0 0 3px #dff1e5}.heading{margin:18px 0 14px}.heading h1{margin:0;font-size:25px;line-height:1.12;letter-spacing:-.025em;color:#21171b}.heading p{margin:6px 0 0;color:#806c74;font-size:12px}.summary{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(170px,.75fr);gap:10px;margin-bottom:14px}.summary-card{min-width:0;border:1px solid #eee2e6;border-radius:13px;padding:12px 14px;background:#fcfafb}.summary-card.amount{background:linear-gradient(135deg,#b31638,#8f1230);border-color:#a31534;color:#fff}.label{display:block;margin-bottom:5px;font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#92737e}.amount .label{color:#f7ced8}.summary-card strong{display:block;overflow-wrap:anywhere;font-size:13px}.amount strong{font-size:25px;line-height:1;color:#fff;letter-spacing:-.02em}.details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.item{min-width:0;border:1px solid #f0e7ea;border-radius:11px;padding:10px 12px;background:#fff}.item.full{grid-column:1/-1}.item dt{margin:0 0 4px;color:#927b84;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.item dd{margin:0;color:#2b1d23;font-size:12px;font-weight:700;line-height:1.42;overflow-wrap:anywhere}.item.mono dd{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.5px;color:#4d3941}.foot{display:flex;gap:12px;align-items:flex-start;margin-top:14px;padding-top:13px;border-top:1px solid #eee5e8}.note{margin:0;color:#79676e;font-size:10.5px;line-height:1.55;flex:1}.print{margin:0;padding:7px 9px;border-radius:9px;background:#f7f2f4;color:#8b5b6b;font-size:9.5px;font-weight:800;white-space:nowrap}@media(max-width:560px){body{padding:10px;display:block}.sheet{padding:17px;border-radius:15px}.top{gap:10px;padding-bottom:14px}.brand{font-size:20px}.paid{padding:6px 8px;font-size:9px}.heading{margin:14px 0 11px}.heading h1{font-size:21px}.summary{grid-template-columns:1fr 1fr;gap:7px}.summary-card{padding:10px}.amount strong{font-size:21px}.details{gap:6px}.item{padding:9px 10px}.item dd{font-size:11.5px}.foot{display:block}.print{display:inline-block;margin-top:8px}.item.long{grid-column:1/-1}}@media(max-width:380px){.summary,.details{grid-template-columns:1fr}.item.full,.item.long{grid-column:auto}.top{align-items:flex-start;flex-direction:column}.paid{align-self:flex-start}}@media print{body{display:block;background:#fff;padding:0}.sheet{width:100%;max-width:none;border:0;border-radius:0;padding:18px;box-shadow:none}.print{display:none}}
</style></head><body><main class="sheet">
<div class="top"><div><div class="brand">ZOBHUNGER</div><div class="eyebrow">PAYMENT RECEIPT · INTERNSHIP DOCUMENTS</div></div><span class="paid">PAYMENT CONFIRMED</span></div>
<div class="heading"><h1>Printing & courier receipt</h1><p>Confirmation for internship document printing and dispatch charges.</p></div>
<section class="summary">
  <div class="summary-card amount"><span class="label">Amount received</span><strong>${escapeHtml(inr(payment.amountPaidPaise ?? payment.amountPaise))}</strong></div>
  <div class="summary-card"><span class="label">Receipt number</span><strong>${escapeHtml(payment.receiptNumber)}</strong></div>
</section>
<dl class="details">
  <div class="item"><dt>Recipient</dt><dd>${escapeHtml(payment.recipientName)}</dd></div>
  <div class="item"><dt>Paid on</dt><dd>${escapeHtml(dateTime(payment.paidAt!))}</dd></div>
  <div class="item long"><dt>Email</dt><dd>${escapeHtml(payment.customerEmail)}</dd></div>
  <div class="item"><dt>Document</dt><dd>${escapeHtml(payment.documentDescription)}</dd></div>
  ${payment.cashfreeTransactionId ? `<div class="item mono"><dt>Cashfree payment ID</dt><dd>${escapeHtml(payment.cashfreeTransactionId)}</dd></div>` : ""}
  ${payment.cashfreeOrderId ? `<div class="item mono full"><dt>Cashfree order</dt><dd>${escapeHtml(payment.cashfreeOrderId)}</dd></div>` : ""}
  <div class="item full"><dt>Delivery address</dt><dd>${escapeHtml(address)}</dd></div>
</dl>
<div class="foot"><p class="note">This electronic receipt confirms payment for printing and courier charges for the requested internship document. It is not a GST tax invoice unless a separate tax invoice is issued by the company accounts team.</p><p class="print">Print-ready receipt</p></div>
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
