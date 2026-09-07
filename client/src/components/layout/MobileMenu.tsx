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
import {
  isNavigationItemActive,
  navigation,
} from "@/data/navigation";
import { site } from "@/data/site";

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
          {navigation.map((item) => (
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
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
