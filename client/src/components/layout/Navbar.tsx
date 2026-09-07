"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ActionLink } from "@/components/common/ActionLink";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { industries } from "@/data/industries";
import {
  isCurrentPath,
  navigation,
  partnerNavigation,
  type NavigationGroup,
} from "@/data/navigation";
import { site } from "@/data/site";
import { solutions } from "@/data/solutions";
import "@/styles/brand.css";

function NavigationShell({ pathname }: { pathname: string }) {
  const [openMenu, setOpenMenu] = useState<NavigationGroup | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const dismissOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !headerRef.current?.contains(event.target)
      )
        setOpenMenu(null);
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      headerRef.current
        ?.querySelector<HTMLButtonElement>(`[data-menu="${openMenu}"]`)
        ?.focus();
      setOpenMenu(null);
    };
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [openMenu]);

  const isActive = (href: string, group?: NavigationGroup) =>
    isCurrentPath(pathname, href) ||
    (group === "solutions" &&
      solutions.some((item) => isCurrentPath(pathname, `/${item.slug}`)));

  return (
    <>
      <a href="#main-content" className="zb-skip-link">
        Skip to content
      </a>
      <header
        className="zb-header"
        ref={headerRef}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setOpenMenu(null);
        }}
      >
        <div className="zb-container zb-header-inner">
          <Link href="/" className="zb-navbar-brand" aria-label="Zobhunger home">
            <Image
              className="zb-navbar-logo"
              src="/Logo/Logo.png"
              alt="ZOBHUNGER"
              width={520}
              height={180}
              priority
              sizes="(max-width: 640px) 150px, 240px"
            />
          </Link>
          <nav className="zb-desktop-nav" aria-label="Main navigation">
            {navigation.map((item) =>
              item.group ? (
                <div key={item.href}>
                  <button
                    type="button"
                    className="zb-nav-link"
                    data-menu={item.group}
                    data-active={isActive(item.href, item.group)}
                    aria-expanded={openMenu === item.group}
                    aria-controls={`zb-navigation-${item.group}`}
                    onClick={() =>
                      setOpenMenu(
                        openMenu === item.group ? null : (item.group ?? null),
                      )
                    }
                  >
                    {item.label}
                    <ChevronDown
                      className="zb-nav-chevron"
                      aria-hidden="true"
                    />
                  </button>
                  <div
                    id={`zb-navigation-${item.group}`}
                    className="zb-nav-panel"
                    hidden={openMenu !== item.group}
                  >
                    <div className="zb-nav-panel-top">
                      <p>
                        {item.group === "solutions"
                          ? "Find the right support for your business."
                          : "Explore solutions for your industry."}
                      </p>
                      <Link href={item.href} onClick={() => setOpenMenu(null)}>
                        View all {item.label.toLowerCase()}
                      </Link>
                    </div>
                    <ul className="zb-nav-grid">
                      {(item.group === "solutions"
                        ? solutions.map((solution) => ({
                            label: solution.label,
                            href: `/${solution.slug}`,
                            description: solution.description,
                          }))
                        : industries.map((industry) => ({
                            label: industry.title,
                            href: `/industries/${industry.slug}`,
                            description: "",
                          }))
                      ).map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            aria-current={
                              pathname === link.href ? "page" : undefined
                            }
                            onClick={() => setOpenMenu(null)}
                          >
                            <strong>{link.label}</strong>
                            {link.description && (
                              <small>{link.description}</small>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.href}
                  className="zb-nav-link"
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  onClick={() => setOpenMenu(null)}
                >
                  {item.label}
                </Link>
              ),
            )}
            <div className="zb-partner-menu">
              <button
                type="button"
                className="zb-action-link zb-partner-nav-cta"
                data-variant="secondary"
                data-menu="partners"
                data-active={
                  isCurrentPath(pathname, "/become-a-partner") ||
                  isCurrentPath(pathname, "/placement-cell-partnership") ||
                  isCurrentPath(pathname, "/placement-cell-login")
                }
                aria-haspopup="menu"
                aria-expanded={openMenu === "partners"}
                aria-controls="zb-navigation-partners"
                onClick={() =>
                  setOpenMenu(openMenu === "partners" ? null : "partners")
                }
              >
                Partner With Us
                <ChevronDown className="zb-nav-chevron" aria-hidden="true" />
              </button>
              <div
                id="zb-navigation-partners"
                className="zb-partner-nav-panel"
                role="menu"
                hidden={openMenu !== "partners"}
              >
                <div className="zb-partner-nav-heading">
                  <span>Partnerships</span>
                  <p>Choose the partnership route that fits your role.</p>
                </div>
                <ul>
                  {partnerNavigation.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        role="menuitem"
                        data-active={isCurrentPath(pathname, link.href)}
                        onClick={() => setOpenMenu(null)}
                      >
                        <strong>{link.label}</strong>
                        <small>{link.description}</small>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  className="zb-partner-login-link"
                  role="menuitem"
                  data-active={isCurrentPath(pathname, "/placement-cell-login")}
                  href="/placement-cell-login"
                  onClick={() => setOpenMenu(null)}
                >
                  Placement Cell Login
                </Link>
              </div>
            </div>
            <ActionLink href={site.primaryAction.href}>
              {site.primaryAction.label}
            </ActionLink>
          </nav>
          <MobileMenu pathname={pathname} />
        </div>
      </header>
    </>
  );
}

export function Navbar() {
  const pathname = usePathname() ?? "/";
  // A route change resets open disclosures and the mobile drawer.
  return <NavigationShell key={pathname} pathname={pathname} />;
}
