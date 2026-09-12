/* eslint-disable @next/next/no-img-element */
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { BrandExperienceGroup } from "@/data/brand-experience";

import { brandLogoUrl } from "@/data/brand-logos";
import { partnerArtwork, partnerArtworkSrc, partnerLogoToken } from "@/data/partner-artwork";

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
          const artwork = partnerArtwork[brand];
          const logoUrl = partnerArtworkSrc(brand) ?? brandLogoUrl(brand);
          const brandToken = partnerLogoToken(brand);
          return (
            <li key={brand}>
              <span className="zb-experience-brand-logo" aria-hidden="true" data-brand={brandToken}>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt=""
                    loading="lazy"
                    width="56"
                    height="28"
                    className={artwork?.invertOnLight ? "zb-partner-mark-dark" : undefined}
                  />
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
