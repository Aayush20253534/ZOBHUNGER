import { ArrowUpRight } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { BrandLogoMarquee } from "@/components/experience/BrandLogoMarquee";

export function BrandExperiencePreview() {
  return (
    <section
      className="zb-home-section zb-home-experience"
      aria-labelledby="home-experience-heading"
    >
      <h2 id="home-experience-heading" className="zb-home-experience-title">
        Our Trusted Partners
      </h2>

      <BrandLogoMarquee compact />

      <div className="zb-home-experience-action">
        <ActionLink href="/brand-experience" variant="secondary">
          Explore brand experience
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </ActionLink>
      </div>
    </section>
  );
}
