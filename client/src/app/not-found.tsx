import { ArrowUpRight } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { PageShell } from "@/components/common/PageShell";

export default function NotFound() {
  return (
    <section className="zb-site-status">
      <PageShell
        eyebrow="404 / Page not found"
        title="Let’s get you to the right place."
        description="This address doesn’t match a page on ZOBHUNGER. Explore our solutions, browse the job pages or return to the home page."
        actions={
          <>
            <ActionLink href="/">
              Return home
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </ActionLink>
            <ActionLink href="/solutions" variant="secondary">
              Explore solutions
            </ActionLink>
            <ActionLink href="/jobs" variant="text">
              Find work
            </ActionLink>
          </>
        }
      />
    </section>
  );
}
