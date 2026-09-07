"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, LogIn } from "lucide-react";
import { ApiError } from "@/lib/api";
import { placementCellLogin } from "@/services/auth.service";

export function PlacementCellLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
    <div className="zb-login-form-heading"><span className="zb-icon-tile"><Building2 /></span><div><p className="zb-eyebrow">Approved partners only</p><h2>Placement Cell Login</h2></div></div>
    <label><span>Official email address</span><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
    <label><span>Password</span><input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
    {error && <p className="zb-login-error" role="alert">{error}</p>}
    <button className="zb-login-submit" disabled={submitting}><LogIn />{submitting ? "Signing in..." : "Sign in to Placement Cell Portal"}</button>
    <p className="zb-login-security-note">Access is available only after ZOBHUNGER approves the institution and the account activation is completed.</p>
  </form>;
}
