/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import { BrandMarqueeMotion } from "@/components/experience/BrandMarqueeMotion";
import { TrustedPartnerMarquee } from "@/components/experience/TrustedPartnerMarquee";
import { brandLogoUrl } from "@/data/brand-logos";
import { brandExperienceGroups } from "@/data/brand-experience";
import "@/styles/brand-marquee.css";

const allBrands = Array.from(
  new Set(brandExperienceGroups.flatMap((group) => group.brands)),
);

const rowCount = 3;
const secondsPerSlide = 1.6;
const rowPhases = [0, 2, 1]; // Visual rows take turns in the order 1 → 3 → 2.
const brandRows = Array.from({ length: rowCount }, (_, row) =>
  allBrands.filter((_, index) => index % rowCount === row),
);

// Each turn moves one card. Reset only after a complete copy has passed, so
// the identical second track makes the loop seamless at every screen size.
// Keep this on the server: the animation needs no timers or per-frame renders.
function rowKeyframes(row: number, length: number) {
  const frame = (turn: number, cards: number) =>
    `${((turn / (length * rowCount)) * 100).toFixed(6)}% { transform: translateX(${((-cards / length) * 50).toFixed(6)}%); }`;
  const frames = [frame(0, 0)];

  for (let card = 0; card < length; card += 1) {
    const turn = card * rowCount + rowPhases[row];
    frames.push(frame(turn, card), frame(turn + 1, card + 1));
  }

  frames.push(frame(length * rowCount, length));
  return `@keyframes zb-brand-row-${row} { ${frames.join("\n")} }`;
}

const animationStyles = brandRows
  .map((brands, row) => rowKeyframes(row, brands.length))
  .join("\n");

function LogoTrack({
  brands,
  hidden = false,
}: {
  brands: string[];
  hidden?: boolean;
}) {
  return (
    <ul className="zb-brand-marquee-track" aria-hidden={hidden || undefined}>
      {brands.map((brand) => {
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
            <span className="zb-brand-marquee-name">{brand}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function BrandLogoMarquee({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return <TrustedPartnerMarquee />;
  }

  return (
    <div
      className="zb-brand-marquee"
      aria-label="Execution experience across brands and markets"
    >
      <style>{animationStyles}</style>
      <BrandMarqueeMotion>
        {brandRows.map((brands, row) => (
          <div className="zb-brand-marquee-window" key={row}>
            <div
              className="zb-brand-marquee-moving-row"
              style={
                {
                  "--zb-marquee-animation": `zb-brand-row-${row}`,
                  "--zb-marquee-duration": `${brands.length * rowCount * secondsPerSlide}s`,
                } as CSSProperties
              }
            >
              <LogoTrack brands={brands} />
              <LogoTrack brands={brands} hidden />
            </div>
          </div>
        ))}
      </BrandMarqueeMotion>
      <p className="zb-brand-marquee-note">
        Brand names indicate project or execution experience and do not imply an exclusive or ongoing partnership.
      </p>
    </div>
  );
}
