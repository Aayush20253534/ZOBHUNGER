"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActionLink } from "@/components/common/ActionLink";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  isNavigationItemActive,
  navigation,
} from "@/data/navigation";
import { site } from "@/data/site";
import "@/styles/brand.css";

export function Navbar() {
  const pathname = usePathname() ?? "/";

  return (
    <>
      <a href="#main-content" className="zb-skip-link">
        Skip to content
      </a>
      <header className="zb-header">
        <div className="zb-container zb-header-inner">
          <div className="zb-header-brand">
            <Link href="/" className="zb-wordmark" aria-label={`${site.name} home`}>
              ZOB<span>HUNGER</span>
            </Link>
            <span className="zb-header-tagline">{site.tagline}</span>
          </div>

          <nav className="zb-desktop-nav" aria-label="Main navigation">
            {navigation.map((item) => {
              const active = isNavigationItemActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  className="zb-nav-link"
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="zb-header-actions">
            <ThemeToggle />
            <ActionLink
              href={site.primaryAction.href}
              className="zb-header-primary-action"
            >
              {site.primaryAction.label}
            </ActionLink>
            <MobileMenu key={pathname} pathname={pathname} />
          </div>
        </div>
      </header>
    </>
  );
}
