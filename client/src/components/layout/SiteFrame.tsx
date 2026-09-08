"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function SiteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/business" || pathname.startsWith("/business/")) {
    return <main className="zb-business-root">{children}</main>;
  }
  return <><Navbar /><main className="mx-auto min-h-[70vh] max-w-6xl px-6 py-12">{children}</main><Footer /></>;
}
