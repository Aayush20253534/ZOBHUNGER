import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("internship hard-copy payments use hosted Cashfree links with invoice generation", async () => {
  const [client, env] = await Promise.all([
    read("server/src/modules/internship-payments/cashfree.client.ts"),
    read("server/src/config/env.ts"),
  ]);
  assert.match(env, /CASHFREE_API_VERSION: z\.literal\("2026-01-01"\)/);
  assert.match(client, /link_partial_payments: false/);
  assert.match(client, /enable_invoice: true/);
  assert.match(client, /link_notify: \{ send_sms: true, send_email: true, send_whatsapp: false \}/);
  assert.match(client, /link_meta: \{ notify_url: input\.notifyUrl \}/);
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

test("admin can create, refresh, cancel and resend internship document receipts", async () => {
  const [routes, ui] = await Promise.all([
    read("server/src/modules/internships/internships.routes.ts"),
    read("client/src/components/admin/InternshipDocumentPaymentPanel.tsx"),
  ]);
  for (const action of ["hard-copy-payment\"", "hard-copy-payment/refresh", "hard-copy-payment/cancel", "hard-copy-payment/resend-receipt"]) {
    assert.ok(routes.includes(action), `missing route ${action}`);
  }
  assert.match(ui, /Create & share Cashfree link/);
  assert.match(ui, /Open Cashfree/);
  assert.match(ui, /Refresh status/);
  assert.match(ui, /Resend receipt email/);
  assert.match(ui, /amountRupees/);
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
  assert.match(service, /status: "PAID"/);
  assert.match(service, /internship\.document_payment_paid/);
  assert.match(notifications, /notifyInternshipDocumentPaymentCompleted/);
  assert.match(notifications, /View payment receipt/);
});
