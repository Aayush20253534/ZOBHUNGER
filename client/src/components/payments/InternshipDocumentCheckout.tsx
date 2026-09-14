"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, FileText, LoaderCircle, LockKeyhole, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";

type PaymentStatus = "ACTIVE" | "PAID" | "EXPIRED" | "CANCELLED";

interface PublicPayment {
  recipientName: string;
  documentDescription: string;
  amountPaise: number;
  currency: string;
  status: PaymentStatus;
  cashfreeStatus: string;
  expiresAt?: string | null;
  paidAt?: string | null;
  receiptUrl?: string | null;
}

interface CheckoutResponse {
  status: "ACTIVE" | "PAID";
  orderId?: string;
  paymentSessionId?: string;
  environment?: "sandbox" | "production";
  receiptUrl?: string | null;
}

declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget?: "_self" | "_blank" | "_top" | "_modal" }) => Promise<unknown> | void;
    };
  }
}

const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
const dateTime = (value: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

let sdkPromise: Promise<void> | null = null;
function loadCashfreeSdk() {
  if (typeof window === "undefined") return Promise.reject(new Error("Checkout can only be opened in a browser."));
  if (window.Cashfree) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-zb-cashfree="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Cashfree secure checkout.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.dataset.zbCashfree = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Cashfree secure checkout."));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export function InternshipDocumentCheckout({ token }: { token: string }) {
  const searchParams = useSearchParams();
  const [payment, setPayment] = useState<PublicPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"pay" | "refresh" | null>(null);
  const [error, setError] = useState("");
  const [returnRefreshDone, setReturnRefreshDone] = useState(false);

  const loadPayment = useCallback(async () => {
    const response = await apiFetch<ApiSuccessEnvelope<{ payment: PublicPayment }>>(`/internship-payments/checkout/${encodeURIComponent(token)}`);
    setPayment(response.data.payment);
    return response.data.payment;
  }, [token]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadPayment()
      .catch(caught => { if (active) setError(caught instanceof Error ? caught.message : "Unable to load this payment request."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadPayment]);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) { setBusy("refresh"); setError(""); }
    try {
      await apiFetch<ApiSuccessEnvelope<{ payment: { status: PaymentStatus } }>>(`/internship-payments/checkout/${encodeURIComponent(token)}/refresh`, { method: "POST" });
      await loadPayment();
    } catch (caught) {
      if (!silent) setError(caught instanceof Error ? caught.message : "Unable to refresh payment status.");
    } finally {
      if (!silent) setBusy(null);
    }
  }, [loadPayment, token]);

  useEffect(() => {
    if (returnRefreshDone || searchParams.get("returned") !== "1") return;
    setReturnRefreshDone(true);
    void refresh(true);
  }, [refresh, returnRefreshDone, searchParams]);

  async function pay() {
    if (busy || payment?.status !== "ACTIVE") return;
    setBusy("pay"); setError("");
    try {
      const response = await apiFetch<ApiSuccessEnvelope<{ checkout: CheckoutResponse }>>(`/internship-payments/checkout/${encodeURIComponent(token)}/order`, { method: "POST" });
      const checkout = response.data.checkout;
      if (checkout.status === "PAID") {
        await loadPayment();
        return;
      }
      if (!checkout.paymentSessionId || !checkout.environment) throw new Error("Secure checkout session was not returned. Please retry.");
      await loadCashfreeSdk();
      if (!window.Cashfree) throw new Error("Cashfree secure checkout could not be initialized.");
      const cashfree = window.Cashfree({ mode: checkout.environment });
      await cashfree.checkout({ paymentSessionId: checkout.paymentSessionId, redirectTarget: "_self" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to open secure checkout.");
    } finally {
      setBusy(null);
    }
  }

  const statusCopy = useMemo(() => {
    if (!payment) return null;
    if (payment.status === "PAID") return { title: "Payment confirmed", text: "Your printing and courier payment has been received. The ZOBHUNGER team can now proceed with the document dispatch workflow." };
    if (payment.status === "CANCELLED") return { title: "Payment request cancelled", text: "This request is no longer payable. Contact the ZOBHUNGER team if you still require the hard copy." };
    if (payment.status === "EXPIRED") return { title: "Payment request expired", text: "This payment request has expired. Please ask the ZOBHUNGER team to issue a new request." };
    return { title: "Secure document payment", text: "Review the amount below, then continue to Cashfree's hosted checkout to complete the payment securely." };
  }, [payment]);

  if (loading) return <section className="zb-pay-shell"><div className="zb-pay-card zb-pay-loading"><LoaderCircle className="zb-pay-spin" aria-hidden="true" /><p>Loading secure payment request…</p></div></section>;
  if (!payment) return <section className="zb-pay-shell"><div className="zb-pay-card"><div className="zb-pay-brand">ZOBHUNGER</div><h1>Payment request unavailable</h1><p>{error || "This payment request could not be found."}</p></div></section>;

  const active = payment.status === "ACTIVE";
  const paid = payment.status === "PAID";

  return <section className="zb-pay-shell">
    <div className="zb-pay-card">
      <header className="zb-pay-header">
        <div><div className="zb-pay-brand">ZOBHUNGER</div><span>Internship document services</span></div>
        <div className="zb-pay-secure"><ShieldCheck aria-hidden="true" />Secure request</div>
      </header>

      <div className={`zb-pay-status zb-pay-status--${payment.status.toLowerCase()}`}>
        {paid ? <CheckCircle2 aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
        <div><h1>{statusCopy?.title}</h1><p>{statusCopy?.text}</p></div>
      </div>

      <div className="zb-pay-amount"><span>Amount due</span><strong>{money(payment.amountPaise)}</strong><small>Printing & courier charges</small></div>

      <dl className="zb-pay-details">
        <div><dt><FileText aria-hidden="true" />Document</dt><dd>{payment.documentDescription}</dd></div>
        <div><dt><Truck aria-hidden="true" />Recipient</dt><dd>{payment.recipientName}</dd></div>
        {payment.expiresAt && <div><dt><Clock3 aria-hidden="true" />Valid until</dt><dd>{dateTime(payment.expiresAt)}</dd></div>}
        {payment.paidAt && <div><dt><CheckCircle2 aria-hidden="true" />Paid on</dt><dd>{dateTime(payment.paidAt)}</dd></div>}
      </dl>

      {error && <div className="zb-pay-error" role="alert">{error}</div>}

      {active && <div className="zb-pay-actions">
        <button type="button" className="zb-pay-primary" onClick={() => void pay()} disabled={busy !== null}>{busy === "pay" ? <LoaderCircle className="zb-pay-spin" aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}Pay securely with Cashfree</button>
        <button type="button" className="zb-pay-secondary" onClick={() => void refresh()} disabled={busy !== null}>{busy === "refresh" ? <LoaderCircle className="zb-pay-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}Refresh payment status</button>
      </div>}

      {paid && payment.receiptUrl && <div className="zb-pay-actions"><a className="zb-pay-primary" href={payment.receiptUrl} target="_blank" rel="noopener noreferrer"><FileText aria-hidden="true" />View payment receipt</a></div>}

      <footer className="zb-pay-foot"><ShieldCheck aria-hidden="true" /><p>Payment credentials are entered only on Cashfree's secure hosted checkout. ZOBHUNGER never receives or stores your UPI PIN, card number, CVV or banking password.</p></footer>
    </div>
  </section>;
}
