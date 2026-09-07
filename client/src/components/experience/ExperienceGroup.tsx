import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { BrandExperienceGroup } from "@/data/brand-experience";

export function ExperienceGroup({ group }: { group: BrandExperienceGroup }) {
  return (
    <Card className="zb-card zb-experience-group">
      <div className="zb-experience-group-heading">
        <span className="zb-experience-category-mark" aria-hidden="true">
          <ArrowUpRight />
        </span>
        <div>
          <h2>{group.title}</h2>
          <p>{group.description}</p>
        </div>
      </div>
      <ul className="zb-experience-brand-list" aria-label={`${group.title} brands`}>
        {group.brands.map((brand) => (
          <li key={brand}>{brand}</li>
        ))}
      </ul>
    </Card>
  );
}
