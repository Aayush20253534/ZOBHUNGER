"use client";

import Image from "next/image";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { getPlacementCellProfile } from "@/services/placement-cell-access.service";

type GuardState = "checking" | "allowed" | "denied" | "error";

export function PlacementPortalGuard({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GuardState>("checking");

  useEffect(() => {
    let active = true;

    getPlacementCellProfile()
      .then(() => {
        if (active) setState("allowed");
      })
      .catch((error) => {
        if (!active) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          setState("denied");
          return;
        }
        setState("error");
      });

    return () => {
      active = false;
    };
  }, []);

  if (state === "checking") {
    return (
      <main className="zb-placement-portal-access-page">
        <section className="zb-placement-portal-access-card" aria-live="polite">
          <span className="zb-placement-portal-access-icon"><LockKeyhole aria-hidden="true" /></span>
          <p className="zb-eyebrow">Placement Cell Portal</p>
          <h1>Checking access</h1>
          <p>Verifying your approved Placement Cell session.</p>
        </section>
      </main>
    );
  }

  if (state === "denied") {
    return (
      <main className="zb-placement-portal-restricted-page">
        <section className="zb-placement-portal-restricted-card" aria-label="Restricted placement portal">
          <Image
            className="zb-placement-portal-restricted-image"
            src="/Restricted_Caricature/Caricature.png"
            alt="Restricted area illustration"
            width={540}
            height={360}
            priority
            sizes="(max-width: 640px) 260px, 360px"
          />
        </section>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="zb-placement-portal-access-page">
        <section className="zb-placement-portal-access-card">
          <span className="zb-placement-portal-access-icon"><LockKeyhole aria-hidden="true" /></span>
          <p className="zb-eyebrow">Portal unavailable</p>
          <h1>Access could not be verified</h1>
          <p>Please try signing in again before opening the Placement Cell Portal.</p>
          <Link className="zb-button zb-button-primary" href="/placement-cell-login">
            Placement Cell Login
          </Link>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
