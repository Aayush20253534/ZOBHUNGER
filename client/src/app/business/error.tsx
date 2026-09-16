"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/client-monitoring";
import { PortalRouteError } from "@/components/common/PortalRouteError";
export default function BusinessError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { void reportClientError(error, "business"); }, [error]);
  return <PortalRouteError title="The business workspace could not be loaded." description="Your session is still protected. Retry the request without losing the current account context." reset={reset} />;
}
