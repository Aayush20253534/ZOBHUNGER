"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { ApiError } from "@/lib/api";
import { activateTechnicalInstitute } from "@/services/technical-institute-portal.service";

export function TechnicalInstituteActivationForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      await activateTechnicalInstitute(token, password);
      setDone(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to activate this account.");
    } finally { setBusy(false); }
  }

  if (done) return <div className="zb-placement-activation-success"><KeyRound /><h2>Technical institute account activated</h2><p>Your approved ITI & Polytechnic partner workspace is ready.</p><Link className="zb-button zb-button-primary" href="/technical-institute-login">Continue to portal login</Link></div>;

  return <form className="zb-login-form" onSubmit={submit}>
    <div className="zb-login-form-heading"><span className="zb-icon-tile"><KeyRound /></span><div><p className="zb-eyebrow">Secure activation</p><h2>Set your portal password</h2></div></div>
    <label><span>New password</span><span className="zb-password-field"><input type={showPassword ? "text" : "password"} minLength={10} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button className="zb-password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</button></span></label>
    <label><span>Confirm password</span><span className="zb-password-field"><input type={showConfirm ? "text" : "password"} minLength={10} autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required /><button className="zb-password-toggle" type="button" onClick={() => setShowConfirm((value) => !value)} aria-label={showConfirm ? "Hide password confirmation" : "Show password confirmation"}>{showConfirm ? <EyeOff /> : <Eye />}</button></span></label>
    {error && <p className="zb-login-error" role="alert">{error}</p>}
    <button className="zb-login-submit" disabled={busy}>{busy ? "Activating..." : "Activate Technical Institute Account"}</button>
    <p className="zb-login-security-note">Use at least 10 characters. Activation links expire after 72 hours and can be used only once.</p>
  </form>;
}
