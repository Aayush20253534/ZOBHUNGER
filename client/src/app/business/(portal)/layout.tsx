import type { ReactNode } from "react";
import { BusinessProvider } from "@/components/business/BusinessProvider";
import { BusinessShell } from "@/components/business/BusinessShell";
export default function Layout({ children }: { children: ReactNode }) {
  return <BusinessProvider><BusinessShell>{children}</BusinessShell></BusinessProvider>;
}
