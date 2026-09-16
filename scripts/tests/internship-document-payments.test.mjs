import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("internship hard-copy payments use Cashfree order checkout instead of Payment Links API", async () => {
  const [client, service, checkoutUi, env] = await Promise.all([
    read("server/src/modules/internship-payments/cashfree.client.ts"),
    read("server/src/modules/internship-payments/internship-payments.service.ts"),
    read("client/src/components/payments/InternshipDocumentCheckout.tsx"),
    read("server/src/config/env.ts"),
  ]);
  assert.match(env, /CASHFREE_API_VERSION: z\.literal\("2026-01-01"\)/);
  assert.match(client, /cashfreeFetch<CashfreeOrder>\("\/orders"/);
  assert.match(client, /payment_session_id/);
  assert.match(client, /order_meta:/);
  assert.match(client, /return_url: input\.returnUrl/);
  assert.match(client, /notify_url: input\.notifyUrl/);
  assert.doesNotMatch(client, /cashfreeFetch<[^>]+>\("\/links"/);
  assert.match(service, /paymentCheckoutUrl\(paymentId, linkVersion, expiresAt\)/);
  assert.match(service, /startPublicInternshipDocumentCheckout/);
  assert.match(checkoutUi, /https:\/\/sdk\.cashfree\.com\/js\/v3\/cashfree\.js/);
  assert.match(checkoutUi, /paymentSessionId: checkout\.paymentSessionId/);
  assert.match(checkoutUi, /Pay securely with Cashfree/);
});

test("Cashfree webhook is verified against raw bytes before JSON parsing", async () => {
  const [app, routes, client] = await Promise.all([
    read("server/src/app.ts"),
    read("server/src/modules/internship-payments/internship-payments.routes.ts"),
    read("server/src/modules/internship-payments/cashfree.client.ts"),
  ]);
  assert.ok(app.indexOf('app.use("/api/v1/payments/cashfree/webhook"') < app.indexOf("app.use(express.json"));
  assert.match(routes, /verifyCashfreeWebhook\(req\.body, timestamp, signature\)/);
  assert.match(client, /createHmac\("sha256", env\.CASHFREE_CLIENT_SECRET\)\.update\(timestamp\)\.update\(rawBody\)/);
  assert.match(client, /timingSafeEqual\(received, expected\)/);
});

test("admin owns the amount and shares a ZOBHUNGER payment page", async () => {
  const [routes, ui, service] = await Promise.all([
    read("server/src/modules/internships/internships.routes.ts"),
    read("client/src/components/admin/InternshipDocumentPaymentPanel.tsx"),
    read("server/src/modules/internship-payments/internship-payments.service.ts"),
  ]);
  for (const action of ["hard-copy-payment\"", "hard-copy-payment/refresh", "hard-copy-payment/cancel", "hard-copy-payment/resend-receipt"]) {
    assert.ok(routes.includes(action), `missing route ${action}`);
  }
  assert.match(ui, /Create & share payment request/);
  assert.match(ui, /Open payment page/);
  assert.match(ui, /Refresh status/);
  assert.match(ui, /amountRupees/);
  assert.match(service, /cashfreeLinkUrl: shareableUrl/);
  assert.match(service, /cashfreeStatus: "NOT_STARTED"/);
});

test("public checkout is token-protected, no-indexed and creates Cashfree orders lazily", async () => {
  const [routes, service, nextConfig, siteFrame] = await Promise.all([
    read("server/src/modules/internship-payments/internship-payments.routes.ts"),
    read("server/src/modules/internship-payments/internship-payments.service.ts"),
    read("client/next.config.ts"),
    read("client/src/components/layout/SiteFrame.tsx"),
  ]);
  assert.match(routes, /\/checkout\/:token\/order/);
  assert.match(routes, /\/checkout\/:token\/refresh/);
  assert.match(service, /internship-document-checkout:v2:/);
  assert.match(service, /timingSafeEqual\(received, expected\)/);
  assert.match(service, /payment\.cashfreeLinkId !== parsed\.checkoutVersion/);
  assert.match(service, /storedCheckoutToken\(payment\.cashfreeLinkUrl\) !== token/);
  assert.match(service, /createCashfreeOrder/);
  assert.match(nextConfig, /https:\/\/sdk\.cashfree\.com/);
  assert.match(nextConfig, /form-action 'self' https:\/\/\*\.cashfree\.com/);
  assert.match(nextConfig, /source: "\/pay\/:path\*"/);
  assert.match(siteFrame, /pathname\.startsWith\("\/pay\/"\)/);
});


test("checkout links rotate on reissue/cancel and stale Cashfree orders cannot settle replacements", async () => {
  const [service, schema, migration] = await Promise.all([
    read("server/src/modules/internship-payments/internship-payments.service.ts"),
    read("server/src/modules/internship-payments/internship-payments.schema.ts"),
    read("server/prisma/migrations/20260921200000_internship_payment_link_rotation/migration.sql"),
  ]);
  assert.match(service, /cashfreeLinkId: linkVersion/);
  assert.match(service, /cashfreeLinkId: revokedCheckoutLinkVersion\(\)/);
  assert.match(service, /cashfreeLinkUrl: revokedCheckoutUrl\(\)/);
  assert.match(service, /cashfreeOrderId\(payment\.id, payment\.cashfreeLinkId\)/);
  assert.match(service, /checkout_version: payment\.cashfreeLinkId/);
  assert.match(service, /cashfree\.webhook_stale_order/);
  assert.match(service, /payment\.cashfreeOrderId !== event\.data\.order\.order_id/);
  assert.match(service, /checkoutVersionMismatch/);
  assert.match(service, /payment\.status === "CANCELLED"/);
  assert.match(schema, /checkout_version: stringish\.optional\(\)/);
  assert.match(schema, /token: z\.string\(\)\.trim\(\)\.min\(76\)\.max\(260\)/);
  assert.doesNotMatch(service, /metadata: \{[^}]*paymentUrl:/);
  assert.match(migration, /metadata.*- 'paymentUrl'/s);
});

test("successful Cashfree payment creates an auditable receipt lifecycle", async () => {
  const [schema, service, notifications] = await Promise.all([
    read("server/prisma/schema.prisma"),
    read("server/src/modules/internship-payments/internship-payments.service.ts"),
    read("server/src/services/notification.service.ts"),
  ]);
  assert.match(schema, /model InternshipDocumentPayment/);
  assert.match(schema, /receiptNumber\s+String\?\s+@unique/);
  assert.match(service, /PAYMENT_SUCCESS_WEBHOOK/);
  assert.match(service, /order_tags\?\.payment_id/);
  assert.match(service, /status: "PAID"/);
  assert.match(service, /internship\.document_payment_paid/);
  assert.match(notifications, /notifyInternshipDocumentPaymentCompleted/);
  assert.match(notifications, /View payment receipt/);
});
