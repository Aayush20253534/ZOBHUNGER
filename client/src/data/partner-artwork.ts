export type PartnerLogoFit = "wordmark" | "balanced" | "badge";

export type PartnerArtwork = {
  file: string;
  invertOnLight?: boolean;
  fit?: PartnerLogoFit;
  /** Optical correction for artwork with large built-in whitespace. */
  scale?: number;
  /** Smaller correction used in the compact brand-experience list. */
  miniScale?: number;
};

// Prefer local partner artwork for the marquee and brand-experience lanes so
// the section stays crisp, consistent and independent of third-party favicons.
export const partnerArtwork: Partial<Record<string, PartnerArtwork>> = {
  Amazon: { file: "amazon.png", fit: "wordmark" },
  Flipkart: { file: "flipkart.svg" },
  Zepto: { file: "zepto.svg" },
  Zomato: { file: "zomato.png", invertOnLight: true, fit: "wordmark" },
  Swiggy: { file: "swiggy.png", fit: "wordmark" },
  Meesho: { file: "meesho.png", fit: "badge" },
  Delhivery: { file: "delhivery.png", fit: "wordmark", scale: 2.35, miniScale: 1.8 },
  Shadowfax: { file: "shadowfax.webp", fit: "wordmark", scale: 1.58, miniScale: 1.42 },
  Rapido: { file: "rapido.png", fit: "wordmark", scale: 1.42, miniScale: 1.3 },
  Ola: { file: "ola.png", fit: "wordmark", scale: 1.72, miniScale: 1.5 },
  Uber: { file: "uber.jpg", fit: "balanced" },
  InDrive: { file: "indrive.png", fit: "wordmark", scale: 1.9, miniScale: 1.58 },
  "Oye Rickshaw": { file: "oyerickshaw.png" },
  KiranKart: { file: "kiran-kart.png" },
  Bikayi: { file: "bikayi.webp", fit: "badge" },
  Locooff: { file: "locooff.png" },
  Freecharge: { file: "freecharge.png", fit: "badge" },
  MobiKwik: { file: "mobikwik.png", fit: "wordmark", scale: 2.0, miniScale: 1.62 },
  Siply: { file: "siply.png" },
  Paytm: { file: "paytm.svg" },
  "Google Pay": { file: "google-pay.webp", fit: "wordmark" },
  "Amazon QR": { file: "Amazon-qr.png", fit: "wordmark" },
  Airtel: { file: "airtel.png", fit: "badge" },
  "Pine Labs": { file: "pine-labs.svg" },
  Tide: { file: "tide.png" },
  Cheq: { file: "cheq.png" },
  PagarBook: { file: "pagarbook.webp", fit: "badge" },
  BharatPe: { file: "Bharatpe.png", fit: "wordmark", scale: 1.76, miniScale: 1.48 },
  Tonetag: { file: "tonetag.png" },
  VacoBinary: { file: "vacobinary.png" },
  "Airtel Payments Bank": { file: "airtel_payments_bank.png", fit: "wordmark", scale: 2.25, miniScale: 1.72 },
  "Axis Bank": { file: "axis-bank.svg" },
  "YES BANK": { file: "yesbank.jpg", fit: "wordmark", scale: 1.16, miniScale: 1.1 },
  "Kotak 811": { file: "kotak-811.png" },
  Upstox: { file: "upstox.svg" },
  "Axis Securities": { file: "Axis_securities.avif", fit: "wordmark", scale: 1.32, miniScale: 1.2 },
  "ICICI Securities": { file: "icici securities.png", fit: "wordmark" },
  Edelweiss: { file: "edelweiss.jpg", fit: "badge" },
  "Angel One": { file: "angel-one.png" },
  "5paisa": { file: "5paisa.png", fit: "wordmark", scale: 1.18, miniScale: 1.12 },
  "Motilal Oswal": { file: "motilal-oswal.png", fit: "wordmark", scale: 1.8, miniScale: 1.5 },
  PwC: { file: "pwc.png", fit: "balanced" },
  "WhiteHat Jr.": { file: "whitehat jr.png", fit: "wordmark", scale: 1.62, miniScale: 1.42 },
  Subway: { file: "subway-logo-png_seeklogo-287348.png" },
  "McDonald's": { file: "mcdonalds.svg" },
  ASUS: { file: "asus.svg" },
  Marlboro: { file: "marlboro.jpeg", fit: "badge" },
  "Brown-Forman": { file: "brown-forman logo.png" },
  "Jim Beam": { file: "Jim-Beam.png", fit: "wordmark" },
  "Tilaknagar Industries": { file: "tilaknagar.svg" },
  Usha: { file: "usha.png", fit: "wordmark", scale: 1.92, miniScale: 1.55 },
  "iD Fresh Food": { file: "id fresh food.webp", fit: "badge" },
};

export function partnerArtworkSrc(brand: string) {
  const file = partnerArtwork[brand]?.file;
  return file ? `/images/partners/${file}` : null;
}

export function partnerLogoToken(brand: string) {
  return brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function partnerLogoFit(brand: string): PartnerLogoFit {
  return partnerArtwork[brand]?.fit ?? "balanced";
}
