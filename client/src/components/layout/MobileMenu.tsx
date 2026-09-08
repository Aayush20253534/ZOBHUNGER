"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronDown, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { ActionLink } from "@/components/common/ActionLink";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  isNavigationItemActive,
  navigation,
} from "@/data/navigation";
import { site } from "@/data/site";
import { solutions } from "@/data/solutions";

export function MobileMenu({ pathname = "/" }: { pathname?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1200px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="zb-mobile-trigger zb-action-link"
        data-variant="secondary"
        aria-label="Open navigation"
      >
        <Menu className="size-5" aria-hidden="true" />
        <span>Menu</span>
      </SheetTrigger>
      <SheetContent side="right" className="zb-mobile-drawer">
        <SheetHeader className="zb-mobile-brand-header border-b px-6 py-6">
          <SheetTitle className="zb-mobile-brand-title">
            <span className="zb-wordmark" aria-label="ZOBHUNGER">
              ZOB<span>HUNGER</span>
            </span>
            <span className="zb-mobile-brand-tagline">{site.tagline}</span>
          </SheetTitle>
          <SheetDescription>
            Workforce and field execution for growing businesses.
          </SheetDescription>
        </SheetHeader>
        <nav
          id="zb-mobile-navigation"
          className="zb-mobile-nav"
          aria-label="Mobile navigation"
        >
          {navigation.map((item) => item.href === "/solutions" ? (
            <details
              key={item.href}
              className="zb-mobile-services"
              open={isNavigationItemActive(pathname, item)}
            >
              <summary>
                {item.label}<ChevronDown aria-hidden="true" />
              </summary>
              <div className="zb-mobile-service-links">
                <Link
                  href="/solutions"
                  aria-current={pathname === "/solutions" ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  Explore all services<ArrowUpRight aria-hidden="true" />
                </Link>
                {solutions.map((solution) => (
                  <Link
                    key={solution.slug}
                    href={`/${solution.slug}`}
                    aria-current={pathname === `/${solution.slug}` ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {solution.label}
                  </Link>
                ))}
              </div>
            </details>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                isNavigationItemActive(pathname, item) ? "page" : undefined
              }
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="zb-mobile-actions">
            <ActionLink
              href={site.primaryAction.href}
              onClick={() => setOpen(false)}
            >
              {site.primaryAction.label}
            </ActionLink>
            <ActionLink
              href={site.workerAction.href}
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              {site.workerAction.label}
            </ActionLink>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
