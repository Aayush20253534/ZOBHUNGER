"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActionLink } from "@/components/common/ActionLink";
import { MobileMenu } from "@/components/layout/MobileMenu";
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
          <Link href="/" className="zb-navbar-brand" aria-label="ZOBHUNGER home">
            <Image
              className="zb-navbar-logo"
              src="/Logo/Logo.png"
              alt="ZOBHUNGER"
              width={96}
              height={96}
              priority
              sizes="(max-width: 640px) 42px, 48px"
            />
          </Link>

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
