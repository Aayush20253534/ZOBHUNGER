"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
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
import { industries } from "@/data/industries";
import { isCurrentPath, navigation } from "@/data/navigation";
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
        <SheetHeader className="border-b px-6 py-6">
          <SheetTitle>ZOBHUNGER</SheetTitle>
          <SheetDescription>
            Workforce, sales and business execution.
          </SheetDescription>
        </SheetHeader>
        <nav
          id="zb-mobile-navigation"
          className="zb-mobile-nav"
          aria-label="Mobile navigation"
        >
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            Home
          </Link>
          {navigation.map((item) =>
            item.group ? (
              <details key={item.href}>
                <summary>{item.label}</summary>
                <ul>
                  <li>
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      View all {item.label.toLowerCase()}
                    </Link>
                  </li>
                  {(item.group === "solutions"
                    ? solutions.map((solution) => ({
                        label: solution.label,
                        href: `/${solution.slug}`,
                      }))
                    : industries.map((industry) => ({
                        label: industry.title,
                        href: `/industries/${industry.slug}`,
                      }))
                  ).map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={
                          pathname === link.href ? "page" : undefined
                        }
                        onClick={() => setOpen(false)}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  isCurrentPath(pathname, item.href) ? "page" : undefined
                }
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ),
          )}
          <div className="zb-mobile-actions">
            <ActionLink
              href="/login"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Portal access
            </ActionLink>
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
