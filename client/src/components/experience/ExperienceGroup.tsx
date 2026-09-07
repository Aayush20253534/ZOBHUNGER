/* eslint-disable @next/next/no-img-element */
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { BrandExperienceGroup } from "@/data/brand-experience";

import { brandLogoUrl } from "@/data/brand-logos";

export function ExperienceGroup({ group, index }: { group: BrandExperienceGroup; index: number }) {
  return (
    <Card className="zb-card zb-experience-group">
      <div className="zb-experience-group-heading">
        <span className="zb-experience-category-mark" aria-hidden="true">
          <ArrowUpRight />
        </span>
        <div className="zb-experience-group-copy">
          <div className="zb-experience-group-meta">
            <span>Experience lane {String(index + 1).padStart(2, "0")}</span>
            <span>{group.brands.length} selected brands</span>
          </div>
          <h2>{group.title}</h2>
          <p>{group.description}</p>
        </div>
      </div>
      <ul className="zb-experience-brand-list" aria-label={`${group.title} brands`}>
        {group.brands.map((brand) => {
          const logoUrl = brandLogoUrl(brand);
          return (
            <li key={brand}>
              <span className="zb-experience-brand-logo" aria-hidden="true">
                {logoUrl ? (
                  <img src={logoUrl} alt="" loading="lazy" width="28" height="28" />
                ) : (
                  <span>{brand.slice(0, 1)}</span>
                )}
              </span>
              <span className="zb-experience-brand-name">{brand}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
