import { market } from "@/data/market";

function optionalPublicUrl(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function publicBaseUrl(value: string | undefined, fallback: string) {
  const resolved = optionalPublicUrl(value) ?? fallback;
  return resolved.replace(/\/$/, "");
}

const publicEmail = "help@zobhungr.com";

export const site = {
  name: "ZOBHUNGER",
  url: publicBaseUrl(
    process.env.NEXT_PUBLIC_SITE_URL,
    "https://zobhungr.com",
  ),
  description:
    "Workforce, sales and business execution solutions for your business.",
  tagline: "Hire. Deploy. Deliver.",
  primaryAction: { label: "Hire Workforce", href: "/hire-workforce" },
  workerAction: { label: "Find work", href: "/jobs" },
  mobileApps: {
    android: {
      label: "Google Play",
      comingSoonLabel: "Coming soon on",
      availableLabel: "Get it on",
      href: optionalPublicUrl(process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL),
    },
    ios: {
      label: "App Store",
      comingSoonLabel: "Coming soon on the",
      availableLabel: "Download on the",
      href: optionalPublicUrl(process.env.NEXT_PUBLIC_APP_STORE_URL),
    },
  },
  publicContact: {
    email: publicEmail,
    emailHref: `mailto:${publicEmail}`,
    phoneLabel: "+91-548-4051917",
    phoneHref: "tel:+915484051917",
    address: "Vijay Tower, Ghazipur, Uttar Pradesh 233001",
    streetAddress: "Vijay Tower",
    addressLocality: "Ghazipur",
    addressRegion: "Uttar Pradesh",
    postalCode: "233001",
    addressCountry: market.primaryMarket.countryCode,
    mapsHref:
      "https://www.google.com/maps/search/?api=1&query=Vijay+Tower+Ghazipur+Uttar+Pradesh+233001",
  },
} as const;
