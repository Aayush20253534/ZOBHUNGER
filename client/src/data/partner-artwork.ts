export type PartnerArtwork = {
  file: string;
  invertOnLight?: boolean;
};

// Prefer local partner artwork for the marquee and brand-experience lanes so
// the section stays crisp, consistent and independent of third-party favicons.
export const partnerArtwork: Partial<Record<string, PartnerArtwork>> = {
  Amazon: { file: "amazon.png" },
  Flipkart: { file: "flipkart.svg" },
  Zepto: { file: "zepto.svg" },
  Zomato: { file: "zomato.png", invertOnLight: true },
  Swiggy: { file: "swiggy.png" },
  Meesho: { file: "meesho.png" },
  Delhivery: { file: "delhivery.png" },
  Shadowfax: { file: "shadowfax.webp" },
  Rapido: { file: "rapido.png" },
  Ola: { file: "ola.png" },
  Uber: { file: "uber.jpg" },
  InDrive: { file: "indrive.png" },
  "Oye Rickshaw": { file: "oyerickshaw.png" },
  KiranKart: { file: "kiran-kart.png" },
  Bikayi: { file: "bikayi.webp" },
  Locooff: { file: "locooff.png" },
  Freecharge: { file: "freecharge.png" },
  MobiKwik: { file: "mobikwik.png" },
  Siply: { file: "siply.png" },
  Paytm: { file: "paytm.svg" },
  "Google Pay": { file: "google-pay.webp" },
  "Amazon QR": { file: "amazon-qr.png" },
  Airtel: { file: "airtel.png" },
  "Pine Labs": { file: "pine-labs.svg" },
  Tide: { file: "tide.png" },
  Cheq: { file: "cheq.png" },
  PagarBook: { file: "pagarbook.webp" },
  BharatPe: { file: "Bharatpe.png" },
  Tonetag: { file: "tonetag.png" },
  VacoBinary: { file: "vacobinary.png" },
  "Airtel Payments Bank": { file: "airtel_payments_bank.png" },
  "Axis Bank": { file: "axis-bank.svg" },
  "YES BANK": { file: "yesbank.jpg" },
  "Kotak 811": { file: "kotak-811.png" },
  Upstox: { file: "upstox.svg" },
  "Axis Securities": { file: "Axis_securities.avif" },
  "ICICI Securities": { file: "icici securities.png" },
  Edelweiss: { file: "edelweiss.jpg" },
  "Angel One": { file: "angel-one.png" },
  "5paisa": { file: "5paisa.png" },
  "Motilal Oswal": { file: "motilal-oswal.png" },
  PwC: { file: "pwc.png" },
  "WhiteHat Jr.": { file: "whitehat jr.png" },
  Subway: { file: "subway-logo-png_seeklogo-287348.png" },
  "McDonald's": { file: "mcdonalds.svg" },
  ASUS: { file: "asus.svg" },
  Marlboro: { file: "marlboro.jpeg" },
  "Brown-Forman": { file: "brown-forman logo.png" },
  "Jim Beam": { file: "Jim-Beam.png" },
  "Tilaknagar Industries": { file: "tilaknagar.svg" },
  Usha: { file: "usha.png" },
  "iD Fresh Food": { file: "id fresh food.webp" },
};

export function partnerArtworkSrc(brand: string) {
  const file = partnerArtwork[brand]?.file;
  return file ? `/images/partners/${file}` : null;
}

export function partnerLogoToken(brand: string) {
  return brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
