"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowUpRight, Building2, CalendarCheck2, CircleHelp, ClipboardList, LayoutDashboard, LogOut, Menu, ShieldCheck, UsersRound, UserRound } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useBusiness } from "./BusinessProvider";
import { BusinessWordmark } from "./BusinessUI";

const links = [{ href: "/business/dashboard", label: "Dashboard", icon: LayoutDashboard }, { href: "/business/requirements", label: "Requirements", icon: ClipboardList }, { href: "/business/candidates", label: "Candidates", icon: UsersRound }, { href: "/business/attendance", label: "Attendance", icon: CalendarCheck2 }, { href: "/business/company", label: "Company profile", icon: Building2 }, { href: "/business/account", label: "Account & security", icon: UserRound }];

export function BusinessShell({ children }: { children: ReactNode }) {
  const { user, profile, signOut } = useBusiness();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  async function handleSignOut() {
    setSigningOut(true); setError("");
    try { await signOut(); } catch { setError("Sign out didn't finish. Please try again."); setSigningOut(false); }
  }
  const navigation = <nav className="zb-biz-nav" aria-label="Business workspace">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : pathname.startsWith(`${href}/`) ? "location" : undefined} onClick={() => setOpen(false)}><Icon aria-hidden="true" />{label}</Link>)}</nav>;
  const account = <div className="zb-biz-sidebar-account"><span className="zb-biz-avatar" aria-hidden="true">{(profile?.companyName || user.email).slice(0, 1).toUpperCase()}</span><div><strong>{profile?.companyName || "Your business"}</strong><span>{user.email}</span></div></div>;
  const signOutButton = <button type="button" className="zb-biz-signout" onClick={handleSignOut} disabled={signingOut}><LogOut aria-hidden="true" />{signingOut ? "Signing out…" : "Sign out"}</button>;
  return <div className="zb-biz-shell">
    <a className="zb-skip-link" href="#business-content">Skip to workspace</a>
    <aside className="zb-biz-sidebar"><BusinessWordmark />{account}<p className="zb-biz-nav-label">WORKSPACE</p>{navigation}<div className="zb-biz-sidebar-bottom"><Link href="/contact"><CircleHelp aria-hidden="true" />Talk to our team<ArrowUpRight aria-hidden="true" /></Link>{signOutButton}</div></aside>
    <div className="zb-biz-workarea">
      <header className="zb-biz-topbar">
        <div className="zb-biz-mobile-menu"><Sheet open={open} onOpenChange={setOpen}><SheetTrigger className="zb-biz-menu-trigger" aria-label="Open workspace navigation"><Menu aria-hidden="true" /></SheetTrigger><SheetContent side="left" className="zb-biz zb-biz-drawer"><SheetHeader><SheetTitle>Business workspace</SheetTitle><SheetDescription>Manage your company and account.</SheetDescription></SheetHeader>{account}{navigation}<div className="zb-biz-sidebar-bottom"><Link href="/contact" onClick={() => setOpen(false)}>Contact support<ArrowUpRight aria-hidden="true" /></Link>{signOutButton}{error && <p className="zb-biz-error" role="alert">{error}</p>}</div></SheetContent></Sheet></div>
        <span className="zb-biz-topbar-title">{pathname === "/business/onboarding" ? "Company setup" : pathname === "/business/requirements/new" ? "New requirement" : pathname.startsWith("/business/candidates/") ? "Candidate profile" : (pathname.startsWith("/business/requirements/") && pathname.endsWith("/candidates")) ? "Requirement candidates" : pathname.startsWith("/business/requirements/") ? pathname.endsWith("/edit") ? "Edit requirement" : "Requirement brief" : links.find(link => link.href === pathname)?.label ?? "Business workspace"}</span>
        <span className="zb-biz-session"><ShieldCheck aria-hidden="true" />Business account</span><Link className="zb-biz-topbar-site" href="/for-business">Website<ArrowUpRight aria-hidden="true" /></Link>
      </header>
      <div id="business-content" tabIndex={-1} className="zb-biz-content">{error && <p className="zb-biz-error" role="alert">{error}</p>}{children}</div>
      <footer className="zb-biz-workspace-footer"><span>ZOBHUNGER · Hire. Deploy. Deliver.</span><Link href="/contact">Help & contact</Link></footer>
    </div>
  </div>;
}
