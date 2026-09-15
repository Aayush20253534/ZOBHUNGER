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
  Shadowfax: { file: "shadowfax.webp", fit: "wordmark", scale: 2.42, miniScale: 1.92 },
  Rapido: { file: "rapido.png", fit: "wordmark", scale: 2.2, miniScale: 1.65 },
  Ola: { file: "ola.png", fit: "wordmark", scale: 2.15, miniScale: 1.62 },
  Uber: { file: "uber.jpg", fit: "balanced", scale: 1.4, miniScale: 1.2 },
  InDrive: { file: "indrive.png", fit: "wordmark", scale: 2.58, miniScale: 1.96 },
  "Oye Rickshaw": { file: "oyerickshaw.png", fit: "wordmark", scale: 1.9, miniScale: 1.58 },
  KiranKart: { file: "kiran-kart.png" },
  Bikayi: { file: "bikayi.webp", fit: "badge", scale: 1.48, miniScale: 1.28 },
  Locooff: { file: "locooff.png", fit: "wordmark", scale: 1.34, miniScale: 1.2 },
  Instamart: { file: "Instamart.jfif", fit: "badge", scale: 1.12, miniScale: 1.06 },
  "Park+": { file: "park.jpeg", fit: "badge", scale: 1.1, miniScale: 1.04 },
  Freecharge: { file: "freecharge.png", fit: "wordmark", scale: 1.42, miniScale: 1.24 },
  MobiKwik: { file: "mobikwik.png", fit: "wordmark", scale: 3.05, miniScale: 2.18 },
  Siply: { file: "siply.png", fit: "wordmark", scale: 1.72, miniScale: 1.48 },
  Paytm: { file: "paytm.svg" },
  "Google Pay": { file: "google-pay.webp", fit: "wordmark" },
  "Amazon QR": { file: "Amazon-qr.png", fit: "wordmark" },
  Airtel: { file: "airtel.png", fit: "badge" },
  "Pine Labs": { file: "pine-labs.svg" },
  Tide: { file: "tide.png" },
  Cheq: { file: "cheq.png" },
  PagarBook: { file: "pagarbook.webp", fit: "badge", scale: 2.28, miniScale: 1.78 },
  BharatPe: { file: "Bharatpe.png", fit: "wordmark", scale: 2.78, miniScale: 2.08 },
  ToneTag: { file: "tonetag.png", fit: "wordmark", scale: 1.08, miniScale: 1.04 },
  MBill: { file: "mbill.png", fit: "balanced", scale: 1.14, miniScale: 1.08 },
  "Shaadi.com": { file: "shaadi.png", fit: "wordmark", scale: 1.08, miniScale: 1.04 },
  Aspire: { file: "aspire.png", fit: "badge", scale: 1.02, miniScale: 1 },
  VacoBinary: { file: "vacobinary.png", fit: "wordmark", scale: 1.72, miniScale: 1.48 },
  Rupeek: { file: "rupeek.jpeg", fit: "wordmark", scale: 1.52, miniScale: 1.36 },
  "Airtel Payments Bank": { file: "airtel_payments_bank.png", fit: "wordmark", scale: 2.58, miniScale: 1.96 },
  "Axis Bank": { file: "axis-bank.svg" },
  "YES BANK": { file: "yesbank.jpg", fit: "wordmark", scale: 1.16, miniScale: 1.1 },
  "Kotak 811": { file: "kotak-811.png" },
  PwC: { file: "pwc.png", fit: "balanced", scale: 1.78, miniScale: 1.48 },
  "WhiteHat Jr.": { file: "whitehat jr.png", fit: "wordmark", scale: 3.05, miniScale: 2.22 },
  Subway: { file: "subway-logo-png_seeklogo-287348.png", fit: "wordmark", scale: 2.42, miniScale: 1.86 },
  "McDonald's": { file: "mcdonalds.svg", fit: "badge", scale: 1.34, miniScale: 1.2 },
  ASUS: { file: "asus.svg" },
  Epson: { file: "epson.png", fit: "wordmark", scale: 1.04, miniScale: 1.02 },
  Marlboro: { file: "marlboro.jpeg", fit: "badge", scale: 1.72, miniScale: 1.46 },
  "Brown-Forman": { file: "brown-forman logo.png", fit: "balanced", scale: 2.82, miniScale: 2.05 },
  "Jim Beam": { file: "Jim-Beam.png", fit: "wordmark", scale: 2.22, miniScale: 1.72 },
  "Tilaknagar Industries": { file: "tilaknagar.svg", fit: "balanced", scale: 1.88, miniScale: 1.52 },
  Usha: { file: "usha.png", fit: "wordmark", scale: 1.92, miniScale: 1.55 },
  "Bharat Zuppos": { file: "BharatZuppos.png", fit: "wordmark", scale: 1.42, miniScale: 1.28 },
  Aayu: { file: "aayu.jpeg", fit: "badge", scale: 1.08, miniScale: 1.04 },
  Frankfinn: { file: "frankfinn.jpeg", fit: "wordmark", scale: 1.48, miniScale: 1.34 },
  IDEMIA: { file: "idemia.jpeg", fit: "wordmark", scale: 1.54, miniScale: 1.38 },
  "Physics Wallah": { file: "pw.png", fit: "wordmark", scale: 1.5, miniScale: 1.34 },
  "Sehat Sathi": { file: "sehatsathi.jpeg", fit: "badge", scale: 1.08, miniScale: 1.04 },
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
