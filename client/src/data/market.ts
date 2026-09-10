export type OperatingLocationType = "headquarters" | "branch";

export interface OperatingLocation {
  id: string;
  type: OperatingLocationType;
  label: string;
  title: string;
  shortLabel: string;
  description: string;
  countryCode: string;
  mapName: string;
  mapDetail: string;
  mapMarker?: {
    x: number;
    y: number;
    labelX: number;
    labelY: number;
    labelWidth: number;
  };
}

export const market = {
  clientReach: {
    label: "Serving clients worldwide",
    scope: "worldwide",
  },
  primaryMarket: {
    name: "India",
    adjective: "Indian",
    countryCode: "IN",
    locale: "en_IN",
    currency: "INR",
    timeZone: "Asia/Kolkata",
  },
  operatingCountries: [
    { name: "India", countryCode: "IN" },
  ],
} as const;

/**
 * Public operating locations are kept in one place so the Presence page,
 * About page and India footprint graphic stay in sync. Add new locations here;
 * mapMarker is optional for locations that are not represented on the India map.
 */
export const operatingLocations: readonly OperatingLocation[] = [
  {
    id: "ghazipur-hq",
    type: "headquarters",
    label: "Headquarters",
    title: "Ghazipur, Uttar Pradesh",
    shortLabel: "HQ",
    description:
      "The central coordination point for workforce deployment, field execution and business support.",
    countryCode: market.primaryMarket.countryCode,
    mapName: "Ghazipur",
    mapDetail: "HQ",
    mapMarker: {
      x: 203.24,
      y: 192.82,
      labelX: -85,
      labelY: -16,
      labelWidth: 72,
    },
  },
  {
    id: "delhi",
    type: "branch",
    label: "Branch presence",
    title: "Delhi",
    shortLabel: "North",
    description:
      "Supporting requirements across an important northern business and workforce market.",
    countryCode: market.primaryMarket.countryCode,
    mapName: "Delhi",
    mapDetail: "North",
    mapMarker: {
      x: 153.42,
      y: 148.3,
      labelX: 14,
      labelY: -23,
      labelWidth: 66,
    },
  },
  {
    id: "mumbai",
    type: "branch",
    label: "Branch presence",
    title: "Mumbai, Maharashtra",
    shortLabel: "West",
    description:
      "Extending ZOBHUNGER's execution capability into one of India's largest commercial markets.",
    countryCode: market.primaryMarket.countryCode,
    mapName: "Mumbai",
    mapDetail: "West",
    mapMarker: {
      x: 90.35,
      y: 276.56,
      labelX: 13,
      labelY: -17,
      labelWidth: 70,
    },
  },
  {
    id: "bihar",
    type: "branch",
    label: "Branch presence",
    title: "Bihar",
    shortLabel: "East",
    description:
      "Strengthening regional workforce and field execution support across eastern markets.",
    countryCode: market.primaryMarket.countryCode,
    mapName: "Bihar",
    mapDetail: "East",
    mapMarker: {
      x: 225.5,
      y: 206.07,
      labelX: 15,
      labelY: -17,
      labelWidth: 66,
    },
  },
  {
    id: "bengaluru",
    type: "branch",
    label: "Branch presence",
    title: "Bengaluru, Karnataka",
    shortLabel: "South",
    description:
      "Supporting workforce, sales and execution requirements across a key southern business market.",
    countryCode: market.primaryMarket.countryCode,
    mapName: "Bengaluru",
    mapDetail: "South",
    mapMarker: {
      x: 168.79,
      y: 343.87,
      labelX: -72,
      labelY: -3,
      labelWidth: 62,
    },
  },
];
