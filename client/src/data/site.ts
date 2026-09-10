export const site = {
  name: "ZOBHUNGER",
  url: "https://zobhungr.com",
  description:
    "Workforce, sales and business execution solutions for your business.",
  tagline: "Hire. Deploy. Deliver.",
  primaryAction: { label: "Hire Workforce", href: "/hire-workforce" },
  workerAction: { label: "Find work", href: "/jobs" },
  globalReach: {
    label: "Serving clients worldwide",
    primaryMarket: "India",
  },
  mobileApps: {
    android: {
      label: "Google Play",
      statusLabel: "Coming soon on",
      href: null as string | null,
    },
    ios: {
      label: "App Store",
      statusLabel: "Coming soon on the",
      href: null as string | null,
    },
  },
  publicContact: {
    email: "help@zobhungr.com",
    phoneLabel: "+91-548-4051917",
    phoneHref: "tel:+915484051917",
    address:
      "Vijay Villa, 258, Nawapura, CISF Colony, Opium Factory Road, Ghazipur, Uttar Pradesh 233001",
    streetAddress:
      "Vijay Villa, 258, Nawapura, CISF Colony, Opium Factory Road",
    addressLocality: "Ghazipur",
    addressRegion: "Uttar Pradesh",
    postalCode: "233001",
    addressCountry: "IN",
    mapsHref:
      "https://www.google.com/maps/search/?api=1&query=Vijay+Villa+258+Nawapura+CISF+Colony+Opium+Factory+Road+Ghazipur+Uttar+Pradesh+233001",
  },
} as const;
