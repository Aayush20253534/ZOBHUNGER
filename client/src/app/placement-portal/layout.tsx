import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PlacementPortalGuard } from "@/components/placement/PlacementPortalGuard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PlacementPortalLayout({ children }: { children: ReactNode }) {
  return <PlacementPortalGuard>{children}</PlacementPortalGuard>;
}
