"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Ban, CheckCircle2, Copy, ExternalLink, LoaderCircle, Mail, PackageCheck, RefreshCw, Send, WalletCards } from "lucide-react";
import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";

export interface InternshipDocumentPayment {
  id: string;
  recipientName: string;
  customerEmail: string;
  customerPhone: string;
  documentDescription: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  courierNote?: string | null;
  amountPaise: number;
  currency: string;
  cashfreeLinkId: string;
  cashfreeLinkUrl: string;
  cashfreeStatus: string;
  linkExpiresAt?: string | null;
  status: "ACTIVE" | "PAID" | "EXPIRED" | "CANCELLED";
  amountPaidPaise?: number | null;
  cashfreeOrderId?: string | null;
  cashfreeTransactionId?: string | null;
  paidAt?: string | null;
  receiptNumber?: string | null;
  receiptIssuedAt?: string | null;
  receiptEmailStatus?: string | null;
  receiptUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApplicantDefaults {
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
}

interface Props {
  applicationId: string;
  applicant: ApplicantDefaults;
  payment?: InternshipDocumentPayment | null;
  onUpdated: (payment: InternshipDocumentPayment | null) => void;
}

interface FormState {
  recipientName: string;
  customerEmail: string;
  customerPhone: string;
  documentDescription: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  courierNote: string;
  amountRupees: string;
  expiryDays: string;
}

const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
const dateTime = (value: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const paymentLabel = (value: InternshipDocumentPayment["status"]) => value.charAt(0) + value.slice(1).toLowerCase();

export function InternshipDocumentPaymentPanel({ applicationId, applicant, payment, onUpdated }: Props) {
  const [busy, setBusy] = useState<"create" | "refresh" | "cancel" | "receipt" | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<FormState>(() => ({
    recipientName: applicant.fullName,
    customerEmail: applicant.email,
    customerPhone: applicant.phone ?? "",
    documentDescription: "Internship certificate - hard copy",
    addressLine1: "",
    addressLine2: "",
    city: applicant.city ?? "",
    state: applicant.state ?? "",
    postalCode: "",
    courierNote: "",
    amountRupees: "",
    expiryDays: "7",
  }));

  const mayCreate = !payment || payment.status === "CANCELLED" || payment.status === "EXPIRED";
  const active = payment?.status === "ACTIVE";
  const paid = payment?.status === "PAID";
  const deliveryAddress = useMemo(() => payment ? [payment.addressLine1, payment.addressLine2, payment.city, payment.state, payment.postalCode].filter(Boolean).join(", ") : "", [payment]);

  function change<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const amount = Number(form.amountRupees);
    const expiryDays = Number(form.expiryDays);
    if (!Number.isFinite(amount) || amount < 1) { setError("Enter the printing and courier amount before creating the payment link."); return; }
    if (!Number.isInteger(expiryDays) || expiryDays < 1 || expiryDays > 30) { setError("Link expiry must be between 1 and 30 days."); return; }
    setBusy("create"); setError(""); setMessage(""); setCopied(false);
    try {
      const response = await apiFetch<ApiSuccessEnvelope<{ documentPayment: InternshipDocumentPayment }>>(`/admin/internships/${encodeURIComponent(applicationId)}/hard-copy-payment`, {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({
          requestKey: crypto.randomUUID(),
          recipientName: form.recipientName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone,
          documentDescription: form.documentDescription,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          courierNote: form.courierNote,
          amountRupees: amount,
          expiryDays,
        }),
      });
      onUpdated(response.data.documentPayment);
      setMessage("Cashfree payment link created. It has also been sent to the intern by email/SMS where available.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create the Cashfree payment link."); }
    finally { setBusy(null); }
  }

  async function action(type: "refresh" | "cancel" | "receipt") {
    if (busy) return;
    if (type === "cancel" && !window.confirm("Cancel this unpaid Cashfree payment link? The intern will no longer be able to use it.")) return;
    setBusy(type); setError(""); setMessage(""); setCopied(false);
    const suffix = type === "receipt" ? "resend-receipt" : type;
    try {
      const response = await apiFetch<ApiSuccessEnvelope<{ documentPayment: InternshipDocumentPayment }>>(`/admin/internships/${encodeURIComponent(applicationId)}/hard-copy-payment/${suffix}`, {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      onUpdated(response.data.documentPayment);
      setMessage(type === "refresh" ? "Payment status refreshed from Cashfree." : type === "cancel" ? "Payment link cancelled. You can now create a corrected replacement." : "Payment confirmation and receipt email sent again.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The payment action could not be completed."); }
    finally { setBusy(null); }
  }

  async function copyLink() {
    if (!payment?.cashfreeLinkUrl) return;
    try { await navigator.clipboard.writeText(payment.cashfreeLinkUrl); setCopied(true); }
    catch { setError("Clipboard access is unavailable. Open the Cashfree link and copy it from the browser instead."); }
  }

  return <div className="zb-payment-panel">
    <div className="zb-payment-intro">
      <span><WalletCards aria-hidden="true" /></span>
      <div><strong>Optional hard-copy payment</strong><p>Use only when the intern requests a printed certificate or related document. The intern pays on Cashfree’s hosted page; no card, UPI or banking credentials are collected on this website.</p></div>
    </div>

    {message && <p className="zb-payment-message" role="status"><CheckCircle2 aria-hidden="true" />{message}</p>}
    {error && <p className="zb-payment-error" role="alert">{error}</p>}

    {mayCreate && <form className="zb-payment-form" onSubmit={create} aria-busy={busy === "create"}>
      {payment && <div className="zb-payment-replace-note">Previous link: <strong>{paymentLabel(payment.status)}</strong>. Creating a new link will use the details below.</div>}
      <div className="zb-payment-grid">
        <label>Recipient name<input required maxLength={120} value={form.recipientName} onChange={event => change("recipientName", event.target.value)} /></label>
        <label>Email<input required type="email" maxLength={254} value={form.customerEmail} onChange={event => change("customerEmail", event.target.value)} /></label>
        <label>Mobile number<input required inputMode="tel" maxLength={24} value={form.customerPhone} onChange={event => change("customerPhone", event.target.value)} placeholder="10-digit Indian mobile number" /></label>
        <label>Document / hard copy<input required maxLength={240} value={form.documentDescription} onChange={event => change("documentDescription", event.target.value)} /></label>
        <label className="zb-payment-span-2">Courier address<input required maxLength={220} value={form.addressLine1} onChange={event => change("addressLine1", event.target.value)} placeholder="House / street / locality" /></label>
        <label className="zb-payment-span-2">Address line 2 <span>(optional)</span><input maxLength={220} value={form.addressLine2} onChange={event => change("addressLine2", event.target.value)} placeholder="Landmark, building, area" /></label>
        <label>City<input required maxLength={120} value={form.city} onChange={event => change("city", event.target.value)} /></label>
        <label>State<input required maxLength={120} value={form.state} onChange={event => change("state", event.target.value)} /></label>
        <label>PIN / postal code<input required maxLength={12} value={form.postalCode} onChange={event => change("postalCode", event.target.value)} /></label>
        <label>Link valid for<select value={form.expiryDays} onChange={event => change("expiryDays", event.target.value)}><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></label>
        <label>Amount (₹)<input required type="number" min="1" max="100000" step="0.01" inputMode="decimal" value={form.amountRupees} onChange={event => change("amountRupees", event.target.value)} placeholder="e.g. 150" /></label>
        <label className="zb-payment-span-2">Courier / admin note <span>(optional)</span><textarea rows={3} maxLength={1000} value={form.courierNote} onChange={event => change("courierNote", event.target.value)} placeholder="Courier preference, document count or handling note." /></label>
      </div>
      <div className="zb-payment-form-foot"><p>Amount is intentionally admin-controlled. Verify the address and charge before issuing the link.</p><button className="zb-review-button" type="submit" disabled={busy !== null}>{busy === "create" ? <LoaderCircle className="zb-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}Create & share Cashfree link</button></div>
    </form>}

    {payment && !mayCreate && <div className="zb-payment-summary" data-payment-status={payment.status}>
      <div className="zb-payment-summary-head"><div><span className="zb-payment-status">{paymentLabel(payment.status)}</span><h3>{payment.documentDescription}</h3><p>{money(payment.amountPaidPaise ?? payment.amountPaise)} {paid ? "received" : "due"}</p></div><PackageCheck aria-hidden="true" /></div>
      <dl className="zb-payment-facts">
        <div><dt>Recipient</dt><dd>{payment.recipientName}</dd></div>
        <div><dt>Contact</dt><dd>{payment.customerEmail}<br />{payment.customerPhone}</dd></div>
        <div><dt>Delivery</dt><dd>{deliveryAddress}</dd></div>
        <div><dt>Cashfree status</dt><dd>{payment.cashfreeStatus}</dd></div>
        {payment.linkExpiresAt && <div><dt>Link expiry</dt><dd>{dateTime(payment.linkExpiresAt)}</dd></div>}
        {payment.paidAt && <div><dt>Paid on</dt><dd>{dateTime(payment.paidAt)}</dd></div>}
        {payment.cashfreeTransactionId && <div><dt>Cashfree payment ID</dt><dd>{payment.cashfreeTransactionId}</dd></div>}
        {payment.receiptNumber && <div><dt>Receipt</dt><dd>{payment.receiptNumber}<br /><small>Email: {payment.receiptEmailStatus ?? "PENDING"}</small></dd></div>}
      </dl>
      {active && <div className="zb-payment-linkbox"><div><span>Shareable payment link</span><a href={payment.cashfreeLinkUrl} target="_blank" rel="noopener noreferrer">{payment.cashfreeLinkUrl}</a></div><button type="button" onClick={() => void copyLink()}><Copy aria-hidden="true" />{copied ? "Copied" : "Copy"}</button></div>}
      <div className="zb-payment-actions">
        {active && <><a className="zb-review-button" href={payment.cashfreeLinkUrl} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden="true" />Open Cashfree</a><button className="zb-review-button zb-review-button--secondary" type="button" disabled={busy !== null} onClick={() => void action("refresh")}>{busy === "refresh" ? <LoaderCircle className="zb-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}Refresh status</button><button className="zb-review-button zb-payment-danger" type="button" disabled={busy !== null} onClick={() => void action("cancel")}><Ban aria-hidden="true" />Cancel unpaid link</button></>}
        {paid && <><button className="zb-review-button zb-review-button--secondary" type="button" disabled={busy !== null} onClick={() => void action("refresh")}>{busy === "refresh" ? <LoaderCircle className="zb-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}Refresh from Cashfree</button>{payment.receiptUrl && <a className="zb-review-button" href={payment.receiptUrl} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden="true" />Open receipt</a>}<button className="zb-review-button zb-review-button--secondary" type="button" disabled={busy !== null} onClick={() => void action("receipt")}>{busy === "receipt" ? <LoaderCircle className="zb-spin" aria-hidden="true" /> : <Mail aria-hidden="true" />}Resend receipt email</button></>}
      </div>
      {payment.courierNote && <p className="zb-payment-note"><strong>Courier note:</strong> {payment.courierNote}</p>}
    </div>}
  </div>;
}
