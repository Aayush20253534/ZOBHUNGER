"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowUpRight, Bookmark, CircleHelp, LogOut, Menu, RefreshCw, Search, ShieldCheck, UserRound, WifiOff } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useWorker } from "./WorkerProvider";
import { WorkerAlert, WorkerWordmark } from "./WorkerUI";

const links = [{ href: "/worker/jobs", label: "Find work", icon: Search }, { href: "/worker/saved-jobs", label: "Saved jobs", icon: Bookmark }, { href: "/worker/profile", label: "My profile & CV", icon: UserRound }];
export function WorkerShell({ children }: { children: ReactNode }) {
  const { user, profile, completion, signOut, notice, refresh } = useWorker(); const pathname = usePathname();
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const name = profile?.fullName || "Your worker account";
  const navigation = <nav className="zw-nav" aria-label="Worker navigation">{links.map(({ href, label, icon: Icon }) => <Link href={href} key={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined} onClick={() => setOpen(false)}><Icon aria-hidden="true" />{label}</Link>)}</nav>;
  async function leave() { setBusy(true); setError(""); try { await signOut(); } catch { setError("Sign out didn't finish. Please try again."); setBusy(false); } }
  const account = <div className="zw-account"><span className="zw-avatar" aria-hidden="true">{name.slice(0, 1)}</span><div><strong>{name}</strong><span>{user.email}</span></div></div>;
  const bottom = <div className="zw-sidebar-bottom"><Link href="/contact"><CircleHelp aria-hidden="true" />Need a hand?<ArrowUpRight aria-hidden="true" /></Link><button type="button" onClick={leave} disabled={busy}><LogOut aria-hidden="true" />{busy ? "Signing out…" : "Sign out"}</button></div>;
  return <div className="zw-shell"><a className="zw-skip" href="#worker-content">Skip to worker content</a>
    <aside className="zw-sidebar"><WorkerWordmark />{account}<p className="zw-eyebrow">YOUR WORK SPACE</p>{navigation}<Link className="zw-side-progress" href="/worker/profile"><span>Profile completed<strong>{completion.percent}%</strong></span><progress value={completion.percent} max={100} aria-label="Profile completion" /><small>Add your skills. Show your strengths.</small></Link>{bottom}</aside>
    <div className="zw-workarea"><header className="zw-topbar"><div className="zw-mobile-menu"><Sheet open={open} onOpenChange={setOpen}><SheetTrigger className="zw-menu-trigger" aria-label="Open worker navigation"><Menu aria-hidden="true" /></SheetTrigger><SheetContent side="left" className="zw zw-drawer"><SheetHeader><SheetTitle>Your worker space</SheetTitle><SheetDescription>Find roles, save opportunities and manage your profile.</SheetDescription></SheetHeader>{account}{navigation}{bottom}<WorkerAlert message={error} /></SheetContent></Sheet></div><span>{links.find(link => pathname.startsWith(link.href))?.label || "Worker space"}</span><span className="zw-verified"><ShieldCheck aria-hidden="true" />Email verified</span><Link href="/for-workers" aria-label="Back to the website">Website<ArrowUpRight aria-hidden="true" /></Link></header>
      <main id="worker-content" className="zw-content" tabIndex={-1}><WorkerAlert message={error} />{notice && <div className="zw-connection" role="status"><WifiOff aria-hidden="true" /><p>{notice}</p><button className="zw-button zw-button--secondary" onClick={refresh}><RefreshCw aria-hidden="true" />Retry</button></div>}{children}</main>
      <footer className="zw-footer"><span>ZOBHUNGER · Your skills. Your next step.</span><Link href="/contact">Help & contact</Link></footer>
    </div>
  </div>;
}
