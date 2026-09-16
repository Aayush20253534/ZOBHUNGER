"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/client-monitoring";

import { RotateCcw, TriangleAlert } from "lucide-react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { void reportClientError(error, "admin"); }, [error]);
  return (
    <section className="zbo-admin-route-state" role="alert" aria-labelledby="admin-error-title">
      <span className="zbo-admin-route-state-icon"><TriangleAlert aria-hidden="true" /></span>
      <div className="zbo-admin-route-state-copy">
        <p className="zbo-eyebrow">Workspace interrupted</p>
        <h1 id="admin-error-title">This desk could not be loaded.</h1>
        <p>The secure admin shell is still available. Retry the workspace without leaving your session.</p>
      </div>
      <button type="button" onClick={reset}><RotateCcw aria-hidden="true" />Try again</button>
    </section>
  );
}
