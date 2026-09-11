"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function SiteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/security") {
    return <div className="zb-admin-security-root">{children}</div>;
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return <div className="zb-admin-route-root">{children}</div>;
  }
  if (pathname === "/employee-joining" || pathname.startsWith("/employee-joining/")) {
    return <main className="zb-employee-joining-root">{children}</main>;
  }
  if (pathname === "/business" || pathname.startsWith("/business/")) {
    return <main className="zb-business-root">{children}</main>;
  }
  if (pathname === "/worker" || pathname.startsWith("/worker/")) {
    return <div className="zb-worker-root">{children}</div>;
  }
  return <><Navbar /><main className="mx-auto min-h-[70vh] max-w-6xl px-6 py-12">{children}</main><Footer /></>;
}
