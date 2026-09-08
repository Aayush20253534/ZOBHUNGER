/* eslint-disable @next/next/no-img-element */
import { brandLogoUrl } from "@/data/brand-logos";
import { brandExperienceGroups } from "@/data/brand-experience";
import "@/styles/brand-marquee.css";

const allBrands = Array.from(
  new Set(brandExperienceGroups.flatMap((group) => group.brands)),
);

function LogoTrack({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="zb-brand-marquee-track" aria-hidden={hidden || undefined}>
      {allBrands.map((brand) => {
        const logoUrl = brandLogoUrl(brand);
        return (
          <li key={brand}>
            <span className="zb-brand-marquee-logo" aria-hidden="true">
              {logoUrl ? (
                <img src={logoUrl} alt="" loading="lazy" width="42" height="42" />
              ) : (
                <span>{brand.slice(0, 1)}</span>
              )}
            </span>
            <span>{brand}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function BrandLogoMarquee({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`zb-brand-marquee${compact ? " zb-brand-marquee--compact zb-brand-marquee--static" : ""}`}
      aria-label="Execution experience across brands and markets"
    >
      <div className="zb-brand-marquee-window">
        {compact ? (
          <div className="zb-brand-marquee-static-grid">
            <LogoTrack />
          </div>
        ) : (
          <div className="zb-brand-marquee-moving-row">
            <LogoTrack />
            <LogoTrack hidden />
          </div>
        )}
      </div>
      <p className="zb-brand-marquee-note">
        Brand names indicate project or execution experience and do not imply an exclusive or ongoing partnership.
      </p>
    </div>
  );
}
