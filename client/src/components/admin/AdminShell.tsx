"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, Menu, ShieldCheck, X } from "lucide-react";
import {
  adminNavigation,
  adminSecurityNavigationItem,
  findAdminNavigationGroup,
  findAdminNavigationItem,
  isAdminNavigationItemActive,
} from "@/data/admin-navigation";
import { site } from "@/data/site";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const [navigationOpen, setNavigationOpen] = useState(false);
  const isSecurityRoute = pathname.startsWith(adminSecurityNavigationItem.href);
  const currentItem = isSecurityRoute ? adminSecurityNavigationItem : findAdminNavigationItem(pathname);
  const currentGroup = isSecurityRoute ? { label: "Account" } : findAdminNavigationGroup(pathname);

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

  return (
    <div className="zbo-admin-shell">
      <aside
        className={`zbo-admin-sidebar${navigationOpen ? " is-open" : ""}`}
        aria-label="Operations navigation"
      >
        <div className="zbo-admin-sidebar-brand">
          <Link href="/admin" className="zbo-admin-wordmark" aria-label={`${site.name} operations overview`}>
            <strong>ZOB<span>HUNGER</span></strong>
            <span>Operations workspace</span>
          </Link>
          <button
            className="zbo-admin-close"
            type="button"
            aria-label="Close navigation"
            onClick={() => setNavigationOpen(false)}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="zbo-admin-sidebar-scroll">
          {adminNavigation.map((group) => (
            <div className="zbo-admin-nav-group" key={group.label}>
              <p className="zbo-admin-nav-label">{group.label}</p>
              <nav aria-label={group.label}>
                {group.items.map((item) => {
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
                      <span className="zbo-admin-nav-copy">
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </span>
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
            <span>Open public website</span>
            <ArrowUpRight aria-hidden="true" />
          </a>
          <div className="zbo-admin-security-status">
            <span className="zbo-admin-status-dot" aria-hidden="true" />
            <span>Protected operations area</span>
          </div>
        </div>
      </aside>

      {navigationOpen && (
        <button
          className="zbo-admin-sidebar-overlay"
          type="button"
          aria-label="Close navigation"
          onClick={() => setNavigationOpen(false)}
        />
      )}

      <div className="zbo-admin-main">
        <header className="zbo-admin-topbar">
          <button
            className="zbo-admin-menu-button"
            type="button"
            aria-label="Open navigation"
            aria-expanded={navigationOpen}
            onClick={() => setNavigationOpen(true)}
          >
            <Menu aria-hidden="true" />
          </button>
          <div className="zbo-admin-context">
            <span>{currentGroup.label}</span>
            <strong>{currentItem.label}</strong>
          </div>
          <div className="zbo-admin-topbar-meta">
            <span className="zbo-admin-live-indicator"><i aria-hidden="true" />Live workspace</span>
            <span className="zbo-admin-avatar" aria-label="Administrator account">AO</span>
          </div>
        </header>
        <main className="zbo-admin-content">
          <div className="zbo-admin-content-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
