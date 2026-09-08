import Link from "next/link";
import {
  ArrowUpRight,
  Factory,
  HeartPulse,
  Landmark,
  Monitor,
  Package,
  MessageSquareText,
  Rocket,
  ShoppingBasket,
  ShoppingCart,
  Store,
  Truck,
  Utensils,
  Wifi,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Card } from "@/components/ui/card";
import { home, homeIndustryDescriptions } from "@/data/home";
import { industries } from "@/data/industries";

const icons = {
  fmcg: ShoppingBasket,
  retail: Store,
  "e-commerce": ShoppingCart,
  "bfsi-fintech": Landmark,
  telecom: Wifi,
  logistics: Truck,
  "food-beverage": Utensils,
  "consumer-electronics": Monitor,
  manufacturing: Factory,
  healthcare: HeartPulse,
  startups: Rocket,
};

export function IndustriesPreview() {
  return (
    <section
      id="home-industries"
      className="zb-home-section"
      aria-labelledby="home-industries-heading"
    >
      <SectionHeading
        id="home-industries-heading"
        {...home.industries}
        action={
          <ActionLink href="/industries" variant="text">
            Explore industries
          </ActionLink>
        }
      />
      <div className="zb-home-industries-grid">
        {industries.slice(0, 8).map((industry) => {
          const Icon = icons[industry.slug] ?? Package;
          return (
            <Link
              key={industry.slug}
              href={`/industries/${industry.slug}`}
              className="zb-card-link"
            >
              <Card className="zb-card zb-home-industry-card">
                <span className="zb-home-industry-icon" aria-hidden="true">
                  <Icon />
                </span>
                <div>
                  <h3>{industry.title}</h3>
                  <p>{homeIndustryDescriptions[industry.slug]}</p>
                </div>
                <ArrowUpRight
                  className="zb-home-industry-arrow"
                  aria-hidden="true"
                />
              </Card>
            </Link>
          );
        })}
        <Link href="/contact" className="zb-card-link">
          <Card className="zb-card zb-home-industry-card zb-home-industry-help">
            <span className="zb-home-industry-icon" aria-hidden="true">
              <MessageSquareText />
            </span>
            <div>
              <h3>Need another market?</h3>
              <p>Explore the full industry list or tell us what you need.</p>
            </div>
            <ArrowUpRight
              className="zb-home-industry-arrow"
              aria-hidden="true"
            />
          </Card>
        </Link>
      </div>
    </section>
  );
}
