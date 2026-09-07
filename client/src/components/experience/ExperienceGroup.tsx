/* eslint-disable @next/next/no-img-element */
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { BrandExperienceGroup } from "@/data/brand-experience";

const brandDomains: Record<string, string> = {
  Amazon: "amazon.in",
  Flipkart: "flipkart.com",
  Zepto: "zeptonow.com",
  Zomato: "zomato.com",
  Swiggy: "swiggy.com",
  Meesho: "meesho.com",
  Delhivery: "delhivery.com",
  Shadowfax: "shadowfax.in",
  Rapido: "rapido.bike",
  Ola: "olacabs.com",
  Uber: "uber.com",
  InDrive: "indrive.com",
  "Oye Rickshaw": "oyerickshaw.com",
  Bikayi: "bikayi.com",
  Freecharge: "freecharge.in",
  MobiKwik: "mobikwik.com",
  Siply: "siply.in",
  Paytm: "paytm.com",
  "Google Pay": "pay.google.com",
  "Amazon QR": "amazon.in",
  Airtel: "airtel.in",
  "Pine Labs": "pinelabs.com",
  Tide: "tide.co",
  Cheq: "cheq.one",
  BharatPe: "bharatpe.com",
  "Airtel Payments Bank": "airtel.in/bank",
  "Axis Bank": "axisbank.com",
  "YES BANK": "yesbank.in",
  "Kotak 811": "kotak.com",
  Upstox: "upstox.com",
  "Axis Securities": "axisdirect.in",
  "ICICI Securities": "icicidirect.com",
  Edelweiss: "edelweissfin.com",
  "Angel One": "angelone.in",
  "5paisa": "5paisa.com",
  "Motilal Oswal": "motilaloswal.com",
  PwC: "pwc.in",
  "WhiteHat Jr.": "whitehatjr.com",
  Subway: "subway.com",
  "McDonald's": "mcdonalds.com",
  ASUS: "asus.com",
  Marlboro: "marlboro.com",
  "Brown-Forman": "brown-forman.com",
  "Jim Beam": "jimbeam.com",
  "Tilaknagar Industries": "tilind.com",
  Usha: "usha.com",
  "iD Fresh Food": "idfreshfood.com",
};

function brandLogoUrl(brand: string) {
  const domain = brandDomains[brand];
  return domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    : null;
}

export function ExperienceGroup({ group }: { group: BrandExperienceGroup }) {
  return (
    <Card className="zb-card zb-experience-group">
      <div className="zb-experience-group-heading">
        <span className="zb-experience-category-mark" aria-hidden="true">
          <ArrowUpRight />
        </span>
        <div>
          <h2>{group.title}</h2>
          <p>{group.description}</p>
        </div>
      </div>
      <ul className="zb-experience-brand-list" aria-label={`${group.title} brands`}>
        {group.brands.map((brand) => {
          const logoUrl = brandLogoUrl(brand);
          return (
            <li key={brand}>
              <span className="zb-experience-brand-logo" aria-hidden="true">
                {logoUrl ? (
                  <img src={logoUrl} alt="" loading="lazy" width="28" height="28" />
                ) : (
                  <span>{brand.slice(0, 1)}</span>
                )}
              </span>
              <span className="zb-experience-brand-name">{brand}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
