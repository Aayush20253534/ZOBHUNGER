import {
  ChartNoAxesCombined,
  ClipboardCheck,
  Layers3,
  MapPinned,
  Network,
  ScanSearch,
  Settings2,
  UsersRound,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { home } from "@/data/home";

const icons = {
  platform: Network,
  services: Layers3,
  locations: MapPinned,
  hiring: ScanSearch,
  management: UsersRound,
  attendance: ClipboardCheck,
  reporting: ChartNoAxesCombined,
  scale: Settings2,
};

export function WhyZobhunger() {
  return (
    <section
      className="zb-home-why zb-home-section"
      aria-labelledby="home-why-heading"
    >
      <div className="zb-home-why-intro">
        <p className="zb-eyebrow">{home.why.eyebrow}</p>
        <h2 id="home-why-heading">{home.why.title}</h2>
        <p>{home.why.description}</p>
        <ActionLink href="/for-business" variant="light">
          Work with ZOBHUNGER
        </ActionLink>
      </div>
      <ul className="zb-home-benefits">
        {home.why.benefits.map((benefit) => {
          const Icon = icons[benefit.id];
          return (
            <li key={benefit.id}>
              <Icon aria-hidden="true" />
              <div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
