"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Send, Users } from "lucide-react";
import { ApiError } from "@/lib/api";
import { submitChatbotLead, type ChatbotAudience } from "@/lib/chatbot";

interface ChatbotLeadFormProps {
  audience: Exclude<ChatbotAudience, "UNKNOWN">;
  handover: boolean;
  conversationId: string;
  sourcePath?: string | null;
  onBack: () => void;
  onSubmitted: (message: string) => void;
}

const audienceCopy: Record<Exclude<ChatbotAudience, "UNKNOWN">, { title: string; requirement: string; company: boolean }> = {
  JOB_SEEKER: { title: "Job seeker support", requirement: "Role, city or help you need", company: false },
  BUSINESS: { title: "Business requirement", requirement: "Workforce or service requirement", company: true },
  VENDOR_PARTNER: { title: "Vendor / partner enquiry", requirement: "Partnership or empanelment requirement", company: true },
  GENERAL: { title: "General enquiry", requirement: "How can our team help?", company: false },
};

export function ChatbotLeadForm({ audience, handover, conversationId, sourcePath, onBack, onSubmitted }: ChatbotLeadFormProps) {
  const copy = useMemo(() => audienceCopy[audience], [audience]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", companyName: "", requirement: "", enquiryDetails: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const result = await submitChatbotLead({
        conversationId,
        audience,
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        companyName: form.companyName || undefined,
        requirement: form.requirement,
        enquiryDetails: form.enquiryDetails || undefined,
        sourcePath: sourcePath || undefined,
        handover,
      });
      setDone(result.message);
      onSubmitted(result.message);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : cause instanceof Error ? cause.message : "Could not submit your details.");
    } finally { setBusy(false); }
  }

  if (done) return <div className="zb-chatbot-lead-form zb-chatbot-lead-success"><CheckCircle2 /><strong>Request received</strong><p>{done}</p><button type="button" onClick={onBack}>Back to assistant</button></div>;

  return <form className="zb-chatbot-lead-form" onSubmit={submit}>
    <div className="zb-chatbot-lead-head">
      <button type="button" onClick={onBack} aria-label="Back to chat"><ArrowLeft /></button>
      <span><Users /></span>
      <div><small>{handover ? "Human handover" : "Lead & enquiry"}</small><strong>{copy.title}</strong></div>
    </div>
    <p className="zb-chatbot-lead-note">Share only the details needed for follow-up. Your information is sent to the appropriate ZOBHUNGER team, not to the AI model.</p>
    <div className="zb-chatbot-lead-grid">
      <label>Full name *<input required minLength={2} maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label>Email<input type="email" maxLength={254} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label>Phone<input inputMode="tel" maxLength={24} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
      {copy.company ? <label>Company / organisation<input maxLength={160} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></label> : null}
    </div>
    <label>{copy.requirement} *<textarea required minLength={5} maxLength={1200} rows={3} value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} /></label>
    <label>Additional details<textarea maxLength={3000} rows={2} value={form.enquiryDetails} onChange={(e) => setForm({ ...form, enquiryDetails: e.target.value })} /></label>
    <small className="zb-chatbot-lead-contact-rule">Provide at least an email address or phone number so the team can contact you.</small>
    {error ? <p className="zb-chatbot-lead-error" role="alert">{error}</p> : null}
    <button className="zb-chatbot-lead-submit" type="submit" disabled={busy || (!form.email.trim() && !form.phone.trim())}>
      {busy ? <Loader2 className="is-spinning" /> : <Send />} {handover ? "Request human follow-up" : "Submit enquiry"}
    </button>
  </form>;
}
