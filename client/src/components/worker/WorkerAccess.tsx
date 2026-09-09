"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, ArrowUpRight, Bookmark, Check, CheckCircle2, Eye, EyeOff, FileUser, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { workerAccessHref, workerDestination } from "@/lib/worker-navigation";
import { getWorkerWorkspace, loginWorker, registerWorker, requestWorkerEmail, resetWorkerPassword, verifyWorkerEmail } from "@/services/worker.service";
import { WorkerAlert, WorkerWordmark, workerError } from "./WorkerUI";

type Mode = "login" | "register" | "forgot" | "verify" | "reset";
const content = {
  login: { eyebrow: "WELCOME BACK", title: "Your next step starts here.", copy: "Sign in to find work, save roles and keep your profile ready." },
  register: { eyebrow: "JOIN THE WORKER NETWORK", title: "Bring your skills. Find your next role.", copy: "Create your account, verify your email and build your worker profile." },
  forgot: { eyebrow: "ACCOUNT RECOVERY", title: "Let’s get you back in.", copy: "Enter your worker account email. We’ll send instructions to reset your password." },
  verify: { eyebrow: "ONE MORE STEP", title: "Make your email official.", copy: "Verify your email to open your profile, upload your CV and save opportunities." },
  reset: { eyebrow: "A FRESH START", title: "Choose a new password.", copy: "Use a password you haven’t shared or used for another account." },
};
function PasswordField({ label, value, onChange, confirm = false, fresh = false }: { label: string; value: string; onChange: (value: string) => void; confirm?: boolean; fresh?: boolean }) {
  const [visible, setVisible] = useState(false);
  return <label className="zw-field"><span>{label}</span><span className="zw-password"><input aria-label={label} type={visible ? "text" : "password"} required minLength={fresh ? 8 : 1} maxLength={128} autoComplete={fresh || confirm ? "new-password" : "current-password"} value={value} onChange={event => onChange(event.target.value)} /><button type="button" onClick={() => setVisible(!visible)} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible}>{visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></span></label>;
}
export function WorkerAccess({ mode }: { mode: Mode }) {
  const router = useRouter(); const search = useSearchParams(); const next = workerDestination(search.get("next"));
  const [email, setEmail] = useState(""); const [fullName, setFullName] = useState(""); const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState(""); const [consent, setConsent] = useState(false);
  const [token, setToken] = useState(""); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false); const [completed, setCompleted] = useState(false); const [cooldown, setCooldown] = useState(0);
  const [readingLink, setReadingLink] = useState(mode === "verify" || mode === "reset");
  const fragment = useRef<string | null>(null);
  useEffect(() => {
    if (mode !== "verify" && mode !== "reset") return;
    let active = true;
    const linkToken = fragment.current ?? (fragment.current = new URLSearchParams(window.location.hash.slice(1)).get("token") || "");
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    queueMicrotask(() => {
      if (!active) return;
      setToken(/^[a-f0-9]{64}$/.test(linkToken) ? linkToken : ""); setReadingLink(false);
      if (linkToken && !/^[a-f0-9]{64}$/.test(linkToken)) setError("This link is incomplete. Request a new email below.");
    });
    if (mode === "verify" && !linkToken) void getWorkerWorkspace().then(response => {
      if (!active) return; setEmail(response.data.user.email);
      if (response.data.user.emailVerifiedAt) { setCompleted(true); setMessage("Your email is already verified."); }
    }).catch(() => {});
    return () => { active = false; };
  }, [mode]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    setError(""); setMessage("");
    if ((mode === "register" || mode === "reset") && (password !== confirmation || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password))) {
      setError(password !== confirmation ? "Your passwords don’t match. Please check both entries." : "Use at least 8 characters, including uppercase, lowercase and a number."); return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        const result = await registerWorker({ fullName, phone, email, password, consent, next });
        router.replace(`${workerAccessHref("verify", next)}&delivery=${result.data.emailSent ? "requested" : "unavailable"}`); router.refresh();
      } else if (mode === "login") {
        const result = await loginWorker(email, password);
        router.replace(result.data.user.emailVerifiedAt ? next : workerAccessHref("verify", next)); router.refresh();
      } else if (mode === "verify" && token) {
        await verifyWorkerEmail(token); setToken(""); setCompleted(true); setMessage("Your email is verified. You can continue to your worker space.");
      } else if (mode === "reset") {
        await resetWorkerPassword(token, password); setToken(""); setPassword(""); setConfirmation(""); setCompleted(true); setMessage("Your password has been updated. Sign in with your new password.");
      } else {
        const result = await requestWorkerEmail(mode === "forgot" ? "forgot-password" : "resend-verification", email, next);
        setMessage(result.message); setCooldown(60);
      }
    } catch (caught) { setError(workerError(caught)); }
    finally { setBusy(false); }
  }
  const needsEmail = mode === "register" || mode === "login" || mode === "forgot" || (mode === "verify" && !token);
  const needsPassword = mode === "register" || mode === "login" || mode === "reset";
  const rules = [{ label: "8+ characters", done: password.length >= 8 }, { label: "Uppercase", done: /[A-Z]/.test(password) }, { label: "Lowercase", done: /[a-z]/.test(password) }, { label: "Number", done: /[0-9]/.test(password) }];
  const buttonText = mode === "register" ? "Create worker account" : mode === "login" ? "Sign in" : mode === "verify" && token ? "Verify my email" : mode === "reset" ? "Save new password" : "Send email link";
  return <div className={`zw-auth zw-auth--${mode}`}><header className="zw-auth-top"><WorkerWordmark /><Link href="/jobs">Browse public jobs<ArrowUpRight aria-hidden="true" /></Link></header>
    <main className="zw-auth-grid"><aside className="zw-auth-story"><div className="zw-auth-photo"><Image src="/images/careers/field-opportunities-960.webp" alt="ZOBHUNGER field executives working together in a market" width={960} height={640} sizes="(max-width: 800px) 100vw, 46vw" priority /><div className="zw-photo-label"><ShieldCheck aria-hidden="true" /><span>A place for your skills.<strong>A path to your next opportunity.</strong></span></div></div><div className="zw-auth-story-copy"><p className="zw-eyebrow">YOUR SKILLS, OUT IN THE WORLD</p><h2>Good work begins with you.</h2><div className="zw-access-steps">{[{ icon: ShieldCheck, title: "Verify", copy: "An account that belongs to you" }, { icon: FileUser, title: "Build", copy: "Your profile, skills and CV" }, { icon: Bookmark, title: "Explore", copy: "Roles worth saving" }].map(({ icon: Icon, title, copy }, index) => <div key={title}><span><Icon aria-hidden="true" /></span><small>0{index + 1}</small><h3>{title}</h3><p>{copy}</p></div>)}</div></div></aside>
      <section className="zw-card zw-auth-card"><span className="zw-icon">{mode === "verify" || mode === "forgot" ? <Mail aria-hidden="true" /> : <KeyRound aria-hidden="true" />}</span><p className="zw-eyebrow">{content[mode].eyebrow}</p><h1>{content[mode].title}</h1><p className="zw-muted">{content[mode].copy}</p>
        {mode === "verify" && search.get("delivery") === "unavailable" && !completed && <WorkerAlert message="Your account was created, but the verification email could not be sent. Try again below or contact our team." />}
        {mode === "verify" && search.get("delivery") === "requested" && !message && !completed && <p className="zw-info" role="status">Check your inbox and spam folder for your verification link.</p>}
        <WorkerAlert message={error} />{message && <p className="zw-success" role="status"><CheckCircle2 aria-hidden="true" />{message}</p>}
        {completed ? <Link className="zw-button" href={workerAccessHref("login", next)}>{mode === "reset" ? "Sign in with new password" : "Sign in to your worker space"}<ArrowRight aria-hidden="true" /></Link> : readingLink ? <p role="status">Reading your link…</p> : mode === "reset" && !token ? <Link className="zw-button" href={workerAccessHref("forgot-password", next)}>Request a new reset link<Mail aria-hidden="true" /></Link> : <form className="zw-auth-form" onSubmit={submit}>
          {mode === "register" && <div className="zw-fields"><label className="zw-field"><span>Full name *</span><input autoComplete="name" required minLength={2} maxLength={120} value={fullName} onChange={event => setFullName(event.target.value)} /></label><label className="zw-field"><span>Phone number *</span><input type="tel" autoComplete="tel" required maxLength={24} value={phone} onChange={event => setPhone(event.target.value)} placeholder="e.g. +91 9876543210" /></label></div>}
          {needsEmail && <label className="zw-field"><span>Email address *</span><input type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} /></label>}
          {needsPassword && <PasswordField label={mode === "reset" ? "New password *" : "Password *"} value={password} onChange={setPassword} fresh={mode !== "login"} />}
          {(mode === "register" || mode === "reset") && <><ul className="zw-password-rules" aria-label="Password requirements">{rules.map(rule => <li className={rule.done ? "is-done" : ""} key={rule.label}><Check aria-hidden="true" />{rule.label}</li>)}</ul><PasswordField label="Confirm password *" value={confirmation} onChange={setConfirmation} confirm fresh /></>}
          {mode === "register" && <label className="zw-check"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} /><span>I agree to ZOBHUNGER storing my worker profile details for work opportunities.</span></label>}
          {mode === "login" && <Link className="zw-forgot" href={workerAccessHref("forgot-password", next)}>Forgot password?</Link>}
          <button className="zw-button" type="submit" disabled={busy || (cooldown > 0 && !token)}>{busy ? "Please wait…" : cooldown > 0 && !token ? `Send again in ${cooldown}s` : buttonText}<ArrowRight aria-hidden="true" /></button>
        </form>}
        <div className="zw-auth-links">{mode === "login" ? <p>New to ZOBHUNGER? <Link href={workerAccessHref("register", next)}>Create a worker account</Link></p> : <p>Already have an account? <Link href={workerAccessHref("login", next)}>Worker sign in</Link></p>}{mode === "verify" && token && <button type="button" onClick={() => { setToken(""); setError(""); }}>Request a different verification link</button>}<p><Link href="/business/login">Business access</Link><span aria-hidden="true"> · </span><Link href="/contact">Need help?</Link></p></div>
      </section>
    </main>
  </div>;
}
