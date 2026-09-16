"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/client-monitoring";
import { PortalRouteError } from "@/components/common/PortalRouteError";
export default function PlacementPortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { void reportClientError(error, "placement_portal"); }, [error]);
  return <PortalRouteError title="The placement workspace could not be loaded." description="The portal hit a request or rendering error. Retry the workspace without signing out." reset={reset} />;
}
