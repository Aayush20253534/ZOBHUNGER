import { MapPin } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PageShell } from "@/components/common/PageShell";
import { Card } from "@/components/ui/card";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "Our Presence",
  "Explore ZOBHUNGER's headquarters and growing operating presence across key Indian markets.",
  "/presence",
);

const locations = [
  {
    label: "Headquarters",
    title: "Ghazipur, Uttar Pradesh",
    description:
      "ZOBHUNGER's central operating base for workforce, sales and business execution support.",
  },
  {
    label: "Key market presence",
    title: "Delhi & Mumbai",
    description:
      "Supporting business requirements across two of India's largest commercial markets.",
  },
  {
    label: "Regional presence",
    title: "Bihar",
    description:
      "Extending field execution and workforce reach across important regional markets.",
  },
] as const;

export default function PresencePage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Presence" }]} />
      <PageShell
        eyebrow="Our presence"
        title="Closer to the markets where execution happens."
        description="ZOBHUNGER is building a practical operating presence across key Indian markets, anchored by our headquarters in Ghazipur, Uttar Pradesh."
        actions={<ActionLink href="/contact">Talk to our team</ActionLink>}
      />

      <section className="zb-section" aria-label="ZOBHUNGER locations">
        <div className="zb-card-grid" data-columns="3">
          {locations.map((location) => (
            <Card className="zb-card" key={location.title}>
              <div className="zb-card-top">
                <MapPin className="zb-card-icon" aria-hidden="true" />
                <span className="zb-chip" data-tone="accent">
                  {location.label}
                </span>
              </div>
              <h2 className="zb-card-title">{location.title}</h2>
              <p className="zb-card-copy">{location.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
