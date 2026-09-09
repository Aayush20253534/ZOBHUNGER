import Link from "next/link";
import { AlertCircle, ArrowUpRight, Check, LoaderCircle, type LucideIcon } from "lucide-react";
import { ApiError, apiFieldErrors } from "@/lib/api";
import type { WorkerCompletion } from "@/types/worker.types";

export function workerError(error: unknown) {
  if (!(error instanceof ApiError)) return "We couldn't connect. Your entries are still here; please try again.";
  const fields = [...new Set(Object.values(apiFieldErrors(error)).flat())];
  return fields.length ? fields.slice(0, 6).join(" · ") : error.message;
}
export function WorkerWordmark() { return <Link className="zw-wordmark" href="/" aria-label="ZOBHUNGER home">ZOB<span>HUNGER</span><small>WORKER SPACE</small></Link>; }
export function WorkerLoading({ text = "Opening your workspace…" }: { text?: string }) { return <div className="zw-loading" role="status"><LoaderCircle className="zw-spin" aria-hidden="true" /><p>{text}</p></div>; }
export function WorkerAlert({ message }: { message: string }) { return message ? <div className="zw-alert" role="alert"><AlertCircle aria-hidden="true" /><p>{message}</p></div> : null; }
export function WorkerHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) { return <header className="zw-heading"><p className="zw-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{copy}</p></header>; }
export function WorkerEmpty({ icon: Icon, title, copy, href, label }: { icon: LucideIcon; title: string; copy: string; href?: string; label?: string }) { return <div className="zw-empty"><span className="zw-icon"><Icon aria-hidden="true" /></span><h2>{title}</h2><p>{copy}</p>{href && <Link className="zw-button" href={href}>{label}<ArrowUpRight aria-hidden="true" /></Link>}</div>; }
export function WorkerProgress({ completion, compact = false }: { completion: WorkerCompletion; compact?: boolean }) {
  return <div className={`zw-progress-card${compact ? " zw-progress-card--compact" : ""}`}>
    <div className="zw-progress-top"><span className="zw-progress-ring" style={{ background: `conic-gradient(var(--zw-red) ${completion.percent}%, #f0e6e9 0)` }}><strong>{completion.percent}<small>%</small></strong></span><div><p className="zw-eyebrow">YOUR PROFILE</p><h2>{completion.percent === 100 ? "Your profile is complete" : "Every detail helps"}</h2><p>{completion.percent === 100 ? "Keep your skills and availability up to date." : "Build a clearer picture of the work you can do."}</p></div></div>
    {!compact && <ul className="zw-checklist">{completion.checklist.map(item => <li key={item.id}><Link href={`/worker/profile#${item.id}`}><span className={item.done ? "is-done" : ""} aria-label={item.done ? "Complete" : "To do"}>{item.done ? <Check aria-hidden="true" /> : "·"}</span>{item.label}<ArrowUpRight aria-hidden="true" /></Link></li>)}</ul>}
  </div>;
}
