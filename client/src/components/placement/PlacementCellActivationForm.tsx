"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { ApiError } from "@/lib/api";
import { activatePlacementCell } from "@/services/placement-cell-access.service";

export function PlacementCellActivationForm({ token }: { token: string }) {
  const [password,setPassword]=useState(""); const [confirm,setConfirm]=useState(""); const [error,setError]=useState<string|null>(null); const [done,setDone]=useState(false); const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setError(null);if(password!==confirm){setError("Passwords do not match.");return;}setBusy(true);try{await activatePlacementCell(token,password);setDone(true);}catch(c){setError(c instanceof ApiError?c.message:"Unable to activate this account.");}finally{setBusy(false)}}
  if(done) return <div className="zb-placement-activation-success"><KeyRound/><h2>Account activated</h2><p>Your approved institution partner account is ready.</p><Link className="zb-button zb-button-primary" href="/placement-cell-login">Continue to Institution Partner Login</Link></div>;
  return <form className="zb-login-form" onSubmit={submit}><div className="zb-login-form-heading"><span className="zb-icon-tile"><KeyRound/></span><div><p className="zb-eyebrow">Secure activation</p><h2>Set your portal password</h2></div></div><label><span>New password</span><input type="password" minLength={10} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><label><span>Confirm password</span><input type="password" minLength={10} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required/></label>{error&&<p className="zb-login-error">{error}</p>}<button className="zb-login-submit" disabled={busy}>{busy?"Activating...":"Activate Institution Partner Account"}</button><p className="zb-login-security-note">Use at least 10 characters. Activation links expire after 72 hours and can be used only once.</p></form>;
}
