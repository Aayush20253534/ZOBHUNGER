import type { ReactNode } from "react";
import { PlacementPortalGuard } from "@/components/placement/PlacementPortalGuard";

export default function PlacementPortalLayout({ children }: { children: ReactNode }) {
  return <PlacementPortalGuard>{children}</PlacementPortalGuard>;
}
