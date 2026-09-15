import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TechnicalInstitutePortalGuard } from "@/components/technical-institute-portal/TechnicalInstitutePortalGuard";
import "@/styles/portal.css";
import "@/styles/technical-institute-portal.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: { children: ReactNode }) {
  return <TechnicalInstitutePortalGuard>{children}</TechnicalInstitutePortalGuard>;
}
