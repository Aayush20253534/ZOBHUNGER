"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowUpRight, BarChart3, Building2, CalendarCheck2, CircleHelp, ClipboardList, LayoutDashboard, LogOut, MapPin, Menu, ShieldCheck, UsersRound, UserRound } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useBusiness } from "./BusinessProvider";
import { BusinessWordmark } from "./BusinessUI";

const links = [{ href: "/business/dashboard", label: "Dashboard", icon: LayoutDashboard }, { href: "/business/requirements", label: "Requirements", icon: ClipboardList }, { href: "/business/candidates", label: "Candidates", icon: UsersRound }, { href: "/business/deployments", label: "Team roster", icon: MapPin }, { href: "/business/attendance", label: "Attendance", icon: CalendarCheck2 }, { href: "/business/attendance-approvals", label: "Attendance approvals", icon: ShieldCheck }, { href: "/business/reports", label: "Reports", icon: BarChart3 }, { href: "/business/company", label: "Company profile", icon: Building2 }, { href: "/business/account", label: "Account & security", icon: UserRound }];

function workspaceTitle(pathname: string) {
  if (pathname === "/business/onboarding") return "Company setup";
  if (pathname.startsWith("/business/requirements/drafts")) return "Saved requirement drafts";
  if (pathname.startsWith("/business/attendance-approvals/")) return "Attendance decision";
  if (pathname.endsWith("/jobs")) return "Linked job openings";
  if (pathname === "/business/requirements/new") return "New requirement";
  if (pathname.startsWith("/business/deployments/")) return "Team assignment";
  if (pathname.startsWith("/business/attendance/")) return "Attendance record";
  if (pathname.startsWith("/business/candidates/")) return "Candidate profile";
  if (pathname.startsWith("/business/requirements/")) {
    if (pathname.endsWith("/deployments")) return "Requirement team roster";
    if (pathname.endsWith("/attendance")) return "Requirement attendance";
    if (pathname.endsWith("/candidates")) return "Requirement candidates";
    return pathname.endsWith("/edit") ? "Edit requirement" : "Requirement brief";
  }
  return links.find(link => link.href === pathname)?.label ?? "Business workspace";
}

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
        <span className="zb-biz-topbar-title">{workspaceTitle(pathname)}</span>
        <span className="zb-biz-session"><ShieldCheck aria-hidden="true" />Business account</span><Link className="zb-biz-topbar-site" href="/for-business">Website<ArrowUpRight aria-hidden="true" /></Link>
      </header>
      <div id="business-content" tabIndex={-1} className="zb-biz-content">{error && <p className="zb-biz-error" role="alert">{error}</p>}{children}</div>
      <footer className="zb-biz-workspace-footer"><span>ZOBHUNGER · Hire. Deploy. Deliver.</span><Link href="/contact">Help & contact</Link></footer>
    </div>
  </div>;
}
