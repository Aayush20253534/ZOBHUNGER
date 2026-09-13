export type PartnerLogoFit = "wordmark" | "balanced" | "badge";

export type PartnerArtwork = {
  file: string;
  invertOnLight?: boolean;
  fit?: PartnerLogoFit;
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
  Delhivery: { file: "delhivery.png" },
  Shadowfax: { file: "shadowfax.webp" },
  Rapido: { file: "rapido.png", fit: "badge" },
  Ola: { file: "ola.png", fit: "badge" },
  Uber: { file: "uber.jpg", fit: "balanced" },
  InDrive: { file: "indrive.png", fit: "badge" },
  "Oye Rickshaw": { file: "oyerickshaw.png" },
  KiranKart: { file: "kiran-kart.png" },
  Bikayi: { file: "bikayi.webp", fit: "badge" },
  Locooff: { file: "locooff.png" },
  Freecharge: { file: "freecharge.png", fit: "badge" },
  MobiKwik: { file: "mobikwik.png", fit: "badge" },
  Siply: { file: "siply.png" },
  Paytm: { file: "paytm.svg" },
  "Google Pay": { file: "google-pay.webp", fit: "wordmark" },
  "Amazon QR": { file: "Amazon-qr.png", fit: "wordmark" },
  Airtel: { file: "airtel.png", fit: "badge" },
  "Pine Labs": { file: "pine-labs.svg" },
  Tide: { file: "tide.png" },
  Cheq: { file: "cheq.png" },
  PagarBook: { file: "pagarbook.webp", fit: "badge" },
  BharatPe: { file: "Bharatpe.png", fit: "badge" },
  Tonetag: { file: "tonetag.png" },
  VacoBinary: { file: "vacobinary.png" },
  "Airtel Payments Bank": { file: "airtel_payments_bank.png" },
  "Axis Bank": { file: "axis-bank.svg" },
  "YES BANK": { file: "yesbank.jpg", fit: "wordmark" },
  "Kotak 811": { file: "kotak-811.png" },
  Upstox: { file: "upstox.svg" },
  "Axis Securities": { file: "Axis_securities.avif" },
  "ICICI Securities": { file: "icici securities.png", fit: "wordmark" },
  Edelweiss: { file: "edelweiss.jpg", fit: "badge" },
  "Angel One": { file: "angel-one.png" },
  "5paisa": { file: "5paisa.png" },
  "Motilal Oswal": { file: "motilal-oswal.png" },
  PwC: { file: "pwc.png", fit: "balanced" },
  "WhiteHat Jr.": { file: "whitehat jr.png" },
  Subway: { file: "subway-logo-png_seeklogo-287348.png" },
  "McDonald's": { file: "mcdonalds.svg" },
  ASUS: { file: "asus.svg" },
  Marlboro: { file: "marlboro.jpeg", fit: "badge" },
  "Brown-Forman": { file: "brown-forman logo.png" },
  "Jim Beam": { file: "Jim-Beam.png", fit: "wordmark" },
  "Tilaknagar Industries": { file: "tilaknagar.svg" },
  Usha: { file: "usha.png" },
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
