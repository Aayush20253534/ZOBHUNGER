import { ArrowUpRight, Building2, MapPin } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { SectionHeading } from "@/components/common/SectionHeading";

const markets = ["Delhi", "Mumbai", "Bihar"] as const;

export function HomePresencePreview() {
  return (
    <section
      className="zb-home-section zb-home-presence"
      aria-labelledby="home-presence-title"
    >
      <div className="zb-home-presence-copy">
        <SectionHeading
          id="home-presence-title"
          eyebrow="Our presence"
          title="Closer to the markets where execution happens."
          description="Our operating footprint is anchored in Ghazipur, Uttar Pradesh, with presence across priority markets that support workforce and field execution requirements."
        />
        <ActionLink href="/presence" variant="secondary">
          Explore our presence <ArrowUpRight aria-hidden="true" />
        </ActionLink>
      </div>

      <div className="zb-home-presence-board" aria-label="ZOBHUNGER presence summary">
        <article className="zb-home-presence-hq">
          <span><Building2 aria-hidden="true" /></span>
          <small>Headquarters</small>
          <strong>Ghazipur, Uttar Pradesh</strong>
        </article>
        <div className="zb-home-presence-markets">
          <span className="zb-home-presence-markets-label">Operational presence</span>
          {markets.map((market) => (
            <div key={market}>
              <MapPin aria-hidden="true" />
              <strong>{market}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
