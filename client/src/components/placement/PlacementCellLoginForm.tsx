"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, KeyRound, LogIn, Mail, ShieldCheck } from "lucide-react";
import { ApiError } from "@/lib/api";
import { placementCellLogin } from "@/services/auth.service";

export function PlacementCellLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setSubmitting(true);
    try {
      await placementCellLogin(email.trim(), password);
      router.push("/placement-portal"); router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to sign in. Please try again.");
    } finally { setSubmitting(false); }
  }
  return <form className="zb-login-form" onSubmit={submit}>
    <div className="zb-login-form-heading"><span className="zb-icon-tile"><Building2 /></span><div><p className="zb-eyebrow">Approved partners only</p><h2>Institution Partner Login</h2></div></div>
    <label><span>Official email address</span><span className="zb-auth-input-wrap"><Mail aria-hidden="true"/><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="placement@institution.edu" required /></span></label>
    <label><span>Password</span><span className="zb-password-field zb-auth-input-wrap"><KeyRound aria-hidden="true"/><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required /><button className="zb-password-toggle" type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword?<EyeOff aria-hidden="true"/>:<Eye aria-hidden="true"/>}</button></span></label>
    {error && <p className="zb-login-error" role="alert">{error}</p>}
    <button className="zb-login-submit" disabled={submitting}><LogIn />{submitting ? "Signing in..." : "Sign in to Institution Partner Portal"}</button>
    <p className="zb-login-security-note"><ShieldCheck aria-hidden="true"/>Access is limited to approved and activated institution representatives.</p>
  </form>;
}
