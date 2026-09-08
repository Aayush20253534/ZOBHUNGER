import { ArrowUpRight, Building2, MapPin, Route } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { SectionHeading } from "@/components/common/SectionHeading";

const markets = [
  { name: "Delhi", region: "North market", code: "DEL" },
  { name: "Mumbai", region: "West market", code: "MUM" },
  { name: "Bihar", region: "East market", code: "BIH" },
] as const;

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
        <div className="zb-home-presence-board-head">
          <div>
            <span className="zb-eyebrow">Operating footprint</span>
            <strong>One network. Four coordination points.</strong>
          </div>
          <span className="zb-home-presence-route-icon" aria-hidden="true">
            <Route />
          </span>
        </div>

        <div className="zb-home-presence-network" aria-hidden="true">
          <span className="zb-home-presence-connector zb-home-presence-connector--one" />
          <span className="zb-home-presence-connector zb-home-presence-connector--two" />
          <span className="zb-home-presence-connector zb-home-presence-connector--three" />

          <article className="zb-home-presence-hq">
            <span className="zb-home-presence-node-icon"><Building2 /></span>
            <small>Headquarters</small>
            <strong>Ghazipur</strong>
            <em>Uttar Pradesh</em>
          </article>

          {markets.map((market, index) => (
            <article
              className={`zb-home-presence-market zb-home-presence-market--${index + 1}`}
              key={market.name}
            >
              <span className="zb-home-presence-node-icon"><MapPin /></span>
              <div>
                <small>{market.region}</small>
                <strong>{market.name}</strong>
              </div>
              <b>{market.code}</b>
            </article>
          ))}
        </div>

        <div className="zb-home-presence-board-foot">
          <span><i /> Headquarters</span>
          <span><i data-tone="market" /> Market presence</span>
          <small>Workforce + field execution coordination</small>
        </div>
      </div>
    </section>
  );
}
