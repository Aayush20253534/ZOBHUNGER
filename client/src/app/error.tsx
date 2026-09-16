"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/client-monitoring";

import { ActionButton } from "@/components/common/ActionButton";
import { ActionLink } from "@/components/common/ActionLink";
import { PageShell } from "@/components/common/PageShell";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { void reportClientError(error, "public"); }, [error]);
  return (
    <section className="zb-site-status">
      <PageShell
        eyebrow="Something went wrong"
        title="We couldn’t load this page."
        description="Please try again, or return to the home page to continue exploring."
        actions={
          <>
            <ActionButton onClick={reset}>Try again</ActionButton>
            <ActionLink href="/" variant="secondary">
              Return home
            </ActionLink>
          </>
        }
      />
    </section>
  );
}
