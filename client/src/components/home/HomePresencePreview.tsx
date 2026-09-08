import { ArrowUpRight, Route } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { SectionHeading } from "@/components/common/SectionHeading";
import { OperatingFootprintMap } from "@/components/presence/OperatingFootprintMap";
import "@/styles/presence-map.css";


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
            <strong>One network. Five coordination points.</strong>
          </div>
          <span className="zb-home-presence-route-icon" aria-hidden="true">
            <Route />
          </span>
        </div>

        <div className="zb-home-presence-map-wrap">
          <OperatingFootprintMap compact />
        </div>

        <div className="zb-home-presence-board-foot">
          <small>Workforce + field execution coordination across priority Indian markets</small>
        </div>
      </div>
    </section>
  );
}
