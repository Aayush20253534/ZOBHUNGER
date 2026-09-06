"use client";

import { ActionButton } from "@/components/common/ActionButton";
import { ActionLink } from "@/components/common/ActionLink";
import { PageShell } from "@/components/common/PageShell";

export default function ErrorPage({ reset }: { reset: () => void }) {
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
