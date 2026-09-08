import { ArrowUpRight } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { SectionHeading } from "@/components/common/SectionHeading";
import { OperatingFootprintPanel } from "@/components/presence/OperatingFootprintPanel";

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

      <OperatingFootprintPanel className="zb-home-presence-network-card" />
    </section>
  );
}
