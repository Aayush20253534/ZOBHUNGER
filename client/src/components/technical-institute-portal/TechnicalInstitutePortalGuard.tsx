"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { getTechnicalInstitutePortalProfile } from "@/services/technical-institute-portal.service";

type GuardState = "checking" | "allowed" | "denied" | "error";

export function TechnicalInstitutePortalGuard({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GuardState>("checking");
  useEffect(() => {
    let active = true;
    getTechnicalInstitutePortalProfile().then(() => { if (active) setState("allowed"); }).catch((error) => {
      if (!active) return;
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) setState("denied");
      else setState("error");
    });
    return () => { active = false; };
  }, []);

  if (state === "checking") return <div className="zti-portal-gate"><section><LockKeyhole /><p className="zb-eyebrow">Technical Institute Portal</p><h1>Checking approved access</h1><p>Verifying your ITI & Polytechnic partner session.</p></section></div>;
  if (state === "denied") return <div className="zti-portal-gate"><section><LockKeyhole /><p className="zb-eyebrow">Restricted workspace</p><h1>Approved technical partner access required</h1><p>Sign in with the official institute account linked to an approved ITI or Polytechnic partnership.</p><Link className="zb-button zb-button-primary" href="/technical-institute-login">Technical Institute Login</Link></section></div>;
  if (state === "error") return <div className="zti-portal-gate"><section><LockKeyhole /><p className="zb-eyebrow">Portal unavailable</p><h1>Access could not be verified</h1><p>Sign in again before opening the technical institute workspace.</p><Link className="zb-button zb-button-primary" href="/technical-institute-login">Return to login</Link></section></div>;
  return <>{children}</>;
}
