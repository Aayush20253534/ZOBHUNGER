"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  LoaderCircle,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  adminNavigation,
  adminSecurityNavigationItem,
  findAdminNavigationGroup,
  findAdminNavigationItem,
  isAdminNavigationItemActive,
} from "@/data/admin-navigation";
import { site } from "@/data/site";
import { getCurrentUser } from "@/services/auth.service";
import type { AdminDepartment, AuthUser } from "@/types/auth.types";

const departmentLabels: Record<AdminDepartment, string> = {
  MAIN_ADMIN: "Main Administration",
  HR: "Career & HR",
  TECHNICAL: "Technical",
  PLACEMENT_CELL: "Placement Cell",
  LEGAL: "Legal",
};

function initials(email?: string) {
  if (!email) return "AO";
  const local = email.split("@")[0] ?? "AO";
  const chunks = local.split(/[._-]+/).filter(Boolean);
  return (chunks.length > 1 ? `${chunks[0][0] ?? "A"}${chunks[1][0] ?? "O"}` : local.slice(0, 2)).toUpperCase();
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const router = useRouter();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const isSecurityRoute = pathname.startsWith(adminSecurityNavigationItem.href);
  const currentItem = isSecurityRoute ? adminSecurityNavigationItem : findAdminNavigationItem(pathname);
  const currentGroup = isSecurityRoute ? { label: "Account" } : findAdminNavigationGroup(pathname);

  useEffect(() => {
    let active = true;
    void getCurrentUser()
      .then(response => {
        if (!active) return;
        const user = response.data.user;
        if (user.role !== "ADMIN") {
          router.replace("/login");
          return;
        }
        setAuthUser(user);
        if (!user.adminMfaEnabled && !isSecurityRoute) router.replace("/admin/security");
      })
      .catch(() => { if (active) router.replace("/login"); })
      .finally(() => { if (active) setAuthReady(true); });
    return () => { active = false; };
  }, [isSecurityRoute, router]);

  useEffect(() => {
    setNavigationOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navigationOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavigationOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [navigationOpen]);

  const granted = useMemo(() => new Set(authUser?.adminPermissions ?? []), [authUser]);
  const visibleNavigation = useMemo(() => adminNavigation
    .map(group => ({ ...group, items: group.items.filter(item => !item.permission || granted.has(item.permission)) }))
    .filter(group => group.items.length > 0), [granted]);
  const hasCurrentAccess = isSecurityRoute || !currentItem.permission || granted.has(currentItem.permission);
  const department = authUser?.adminDepartment ? departmentLabels[authUser.adminDepartment] : "Administrator";

  return (
    <div className={`zbo-admin-shell${sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}>
      <aside
        className={`zbo-admin-sidebar${navigationOpen ? " is-open" : ""}${sidebarCollapsed ? " is-collapsed" : ""}`}
        aria-label="Operations navigation"
      >
        <div className="zbo-admin-sidebar-brand">
          <Link href="/admin" className="zbo-admin-wordmark" aria-label={`${site.name} operations overview`}>
            <strong>ZOB<span>HUNGER</span></strong>
            <span>{department}</span>
          </Link>
          <button
            className="zbo-admin-collapse"
            type="button"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={sidebarCollapsed}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed(value => !value)}
          >
            {sidebarCollapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          </button>
          <button className="zbo-admin-close" type="button" aria-label="Close navigation" onClick={() => setNavigationOpen(false)}>
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="zbo-admin-sidebar-scroll">
          {visibleNavigation.map(group => (
            <div className="zbo-admin-nav-group" key={group.label}>
              <p className="zbo-admin-nav-label">{group.label}</p>
              <nav aria-label={group.label}>
                {group.items.map(item => {
                  const Icon = item.icon;
                  const active = isAdminNavigationItemActive(pathname, item.href);
                  return (
                    <Link
                      href={item.href}
                      className={`zbo-admin-nav-item${active ? " is-active" : ""}`}
                      aria-current={active ? "page" : undefined}
                      key={item.href}
                      title={item.description}
                    >
                      <span className="zbo-admin-nav-icon"><Icon aria-hidden="true" /></span>
                      <span className="zbo-admin-nav-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="zbo-admin-sidebar-bottom">
          <Link
            href={adminSecurityNavigationItem.href}
            className={`zbo-admin-security-link${pathname.startsWith(adminSecurityNavigationItem.href) ? " is-active" : ""}`}
            aria-current={pathname.startsWith(adminSecurityNavigationItem.href) ? "page" : undefined}
          >
            <ShieldCheck aria-hidden="true" />
            <span><strong>{adminSecurityNavigationItem.label}</strong><small>{adminSecurityNavigationItem.description}</small></span>
          </Link>
          <a className="zbo-admin-site-link" href="/" target="_blank" rel="noreferrer">
            <span>Open public website</span><ArrowUpRight aria-hidden="true" />
          </a>
          <div className="zbo-admin-security-status">
            <span className="zbo-admin-status-dot" aria-hidden="true" />
            <span>{authUser?.adminMfaEnabled ? "MFA protected access" : "Security setup required"}</span>
          </div>
        </div>
      </aside>

      {navigationOpen && <button className="zbo-admin-sidebar-overlay" type="button" aria-label="Close navigation" onClick={() => setNavigationOpen(false)} />}

      <div className="zbo-admin-main">
        <header className="zbo-admin-topbar">
          <button className="zbo-admin-menu-button" type="button" aria-label="Open navigation" aria-expanded={navigationOpen} onClick={() => setNavigationOpen(true)}>
            <Menu aria-hidden="true" />
          </button>
          <div className="zbo-admin-context"><span>{currentGroup.label}</span><strong>{currentItem.label}</strong></div>
          <div className="zbo-admin-topbar-meta">
            <span className="zbo-admin-department-chip">{department}</span>
            <span className="zbo-admin-live-indicator"><i aria-hidden="true" />Live workspace</span>
            <span className="zbo-admin-avatar" aria-label={authUser?.email ?? "Administrator account"}>{initials(authUser?.email)}</span>
          </div>
        </header>
        <main className="zbo-admin-content">
          <div className="zbo-admin-content-inner">
            {!authReady ? (
              <div className="zbo-admin-shell-state" role="status"><LoaderCircle className="zbo-admin-spin" aria-hidden="true" /><strong>Verifying secure access</strong><span>Checking your department permissions.</span></div>
            ) : authUser && !hasCurrentAccess ? (
              <section className="zbo-admin-access-denied" aria-labelledby="access-denied-title">
                <span className="zbo-admin-access-denied-icon"><ShieldAlert aria-hidden="true" /></span>
                <p className="zbo-eyebrow">Department access</p>
                <h1 id="access-denied-title">This workspace is outside your access.</h1>
                <p>Your {department} administrator account only sees the operational areas assigned to your department.</p>
                <Link href="/admin">Return to your overview</Link>
              </section>
            ) : authUser ? children : null}
          </div>
        </main>
      </div>
    </div>
  );
}
