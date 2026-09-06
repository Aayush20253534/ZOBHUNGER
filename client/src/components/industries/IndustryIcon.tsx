import {
  Building2,
  Factory,
  HeartPulse,
  Landmark,
  Monitor,
  Rocket,
  ShoppingBasket,
  ShoppingCart,
  Store,
  Truck,
  Utensils,
  Wifi,
  type LucideIcon,
} from "lucide-react";

const icons = new Map<string, LucideIcon>([
  ["fmcg", ShoppingBasket],
  ["retail", Store],
  ["e-commerce", ShoppingCart],
  ["bfsi-fintech", Landmark],
  ["telecom", Wifi],
  ["logistics", Truck],
  ["food-beverage", Utensils],
  ["consumer-electronics", Monitor],
  ["manufacturing", Factory],
  ["healthcare", HeartPulse],
  ["startups", Rocket],
]);

export function IndustryIcon({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const Icon = icons.get(slug) ?? Building2;
  return <Icon className={className} aria-hidden="true" />;
}
