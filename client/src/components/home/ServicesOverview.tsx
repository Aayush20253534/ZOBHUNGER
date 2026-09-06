import Link from "next/link";
import { ArrowUpRight, MessagesSquare } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { SectionHeading } from "@/components/common/SectionHeading";
import { SolutionCard } from "@/components/solutions/SolutionCard";
import { Card } from "@/components/ui/card";
import { home } from "@/data/home";
import { solutions } from "@/data/solutions";

export function ServicesOverview() {
  return (
    <section
      id="home-solutions"
      className="zb-home-section"
      aria-labelledby="home-solutions-heading"
    >
      <SectionHeading
        id="home-solutions-heading"
        {...home.solutions}
        action={
          <ActionLink href="/solutions" variant="text">
            Explore all solutions
          </ActionLink>
        }
      />
      <div className="zb-home-solutions-grid">
        {solutions.map((solution) => (
          <SolutionCard key={solution.slug} solution={solution} />
        ))}
        <Link
          href="/hire-workforce"
          className="zb-card-link zb-home-solution-help"
        >
          <Card className="zb-card">
            <MessagesSquare className="zb-card-icon" aria-hidden="true" />
            <h3 className="zb-card-title">Not sure where to start?</h3>
            <p className="zb-card-copy">
              Tell us the work you need done. We’ll help you identify the right
              service or combination of teams.
            </p>
            <span className="zb-card-cta">
              Share your requirement{" "}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </span>
          </Card>
        </Link>
      </div>
    </section>
  );
}
