"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/client-monitoring";
import { PortalRouteError } from "@/components/common/PortalRouteError";
export default function TechnicalInstitutePortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { void reportClientError(error, "technical_institute_portal"); }, [error]);
  return <PortalRouteError title="The institute workspace could not be loaded." description="The portal hit a request or rendering error. Retry the workspace without leaving your session." reset={reset} />;
}
