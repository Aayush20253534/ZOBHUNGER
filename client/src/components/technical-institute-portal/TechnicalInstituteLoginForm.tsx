"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, LogIn, Mail, ShieldCheck, Wrench } from "lucide-react";
import { ApiError } from "@/lib/api";
import { technicalInstituteLogin } from "@/services/auth.service";

export function TechnicalInstituteLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await technicalInstituteLogin(email.trim(), password);
      router.push("/technical-institute-portal");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return <form className="zb-login-form" onSubmit={submit}>
    <div className="zb-login-form-heading"><span className="zb-icon-tile"><Wrench /></span><div><p className="zb-eyebrow">Approved technical partners</p><h2>Institute portal login</h2></div></div>
    <label><span>Official institute email</span><span className="zb-auth-input-wrap"><Mail aria-hidden="true" /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tpo@institution.edu" required /></span></label>
    <label><span>Password</span><span className="zb-password-field zb-auth-input-wrap"><KeyRound aria-hidden="true" /><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button className="zb-password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</button></span></label>
    {error && <p className="zb-login-error" role="alert">{error}</p>}
    <button className="zb-login-submit" disabled={submitting}><LogIn />{submitting ? "Signing in..." : "Sign in to Technical Institute Portal"}</button>
    <p className="zb-login-security-note"><ShieldCheck aria-hidden="true" />Access is restricted to approved and activated ITI & Polytechnic partner representatives.</p>
  </form>;
}
