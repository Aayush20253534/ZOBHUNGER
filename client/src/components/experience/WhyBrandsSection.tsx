import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { brandStrengths } from "@/data/core-capabilities";

export function WhyBrandsSection() {
  return (
    <section
      className="zb-experience-section zb-why-brands"
      aria-labelledby="why-brands-title"
    >
      <div className="zb-why-brands-intro">
        <span className="zb-eyebrow">Why brands work with us</span>
        <h2 id="why-brands-title">One operating partner, from people to execution.</h2>
        <p>
          ZOBHUNGER combines technology, manpower and field execution to help
          brands scale operations and reach customers with a practical,
          project-led delivery model.
        </p>
        <ActionLink href="/hire-workforce">
          Plan an execution requirement
          <ArrowRight className="size-4" aria-hidden="true" />
        </ActionLink>
      </div>

      <ul className="zb-why-brands-list">
        {brandStrengths.map((strength) => (
          <li key={strength}>
            <CheckCircle2 aria-hidden="true" />
            <span>{strength}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
