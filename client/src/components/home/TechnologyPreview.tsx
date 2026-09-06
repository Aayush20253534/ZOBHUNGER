import {
  Check,
  LayoutDashboard,
  PanelsTopLeft,
  Smartphone,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { home } from "@/data/home";

const icons = {
  client: LayoutDashboard,
  worker: Smartphone,
  admin: PanelsTopLeft,
};

export function TechnologyPreview() {
  return (
    <section
      id="home-technology"
      className="zb-home-section zb-home-technology"
      aria-labelledby="home-technology-heading"
    >
      <SectionHeading
        id="home-technology-heading"
        eyebrow={home.technology.eyebrow}
        title={home.technology.title}
        description={home.technology.description}
      />
      <div className="zb-home-technology-grid">
        {home.technology.portals.map((portal) => {
          const Icon = icons[portal.id];
          return (
            <Card key={portal.id} className="zb-card zb-home-technology-card">
              <div className="zb-card-top">
                <Icon className="zb-card-icon" aria-hidden="true" />
                <Badge variant="outline" className="zb-chip">
                  Planned
                </Badge>
              </div>
              <h3 className="zb-card-title">{portal.title}</h3>
              <p className="zb-card-copy">{portal.description}</p>
              <ul>
                {portal.features.map((feature) => (
                  <li key={feature}>
                    <Check aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
      <div className="zb-home-technology-note">
        <p>Have a workflow you want us to understand?</p>
        <ActionLink href="/contact" variant="text">
          Discuss it with our team
        </ActionLink>
      </div>
    </section>
  );
}
