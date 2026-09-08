"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { featuredBrandExperience } from "@/data/brand-experience";
import "@/styles/trusted-partners.css";

// Local brand artwork avoids third-party favicon failures and blurry app icons.
const partnerArtwork: Record<(typeof featuredBrandExperience)[number], string> = {
  Amazon: "amazon.png",
  Flipkart: "flipkart.svg",
  Zepto: "zepto.svg",
  Zomato: "zomato.png",
  Swiggy: "swiggy.png",
  Paytm: "paytm.svg",
  "Google Pay": "google-pay.webp",
  "Axis Bank": "axis-bank.svg",
  Upstox: "upstox.svg",
  "Pine Labs": "pine-labs.svg",
  "McDonald's": "mcdonalds.svg",
  ASUS: "asus.svg",
};

function PartnerMark({ brand }: { brand: (typeof featuredBrandExperience)[number] }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="zb-partner-mark">
      {failed ? (
        <span className="zb-partner-mark-fallback">{brand}</span>
      ) : (
        <img
          src={`/images/partners/${partnerArtwork[brand]}`}
          className={brand === "Zomato" ? "zb-partner-mark-dark" : undefined}
          alt={brand}
          width={128}
          height={48}
          loading="eager"
          decoding="async"
          draggable={false}
          ref={(image) => {
            // Also handle a failed request that completed before hydration.
            if (image?.complete && image.naturalWidth === 0) setFailed(true);
          }}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

export function TrustedPartnerMarquee() {
  return (
    <div className="zb-partner-marquee" role="region" aria-label="Trusted partner brands">
      <div className="zb-partner-viewport">
        <div className="zb-partner-track">
          {[false, true].map((duplicate) => (
            <ul
              className="zb-partner-group"
              key={String(duplicate)}
              aria-hidden={duplicate || undefined}
            >
              {featuredBrandExperience.map((brand) => (
                <li className="zb-partner-item" key={brand}>
                  <PartnerMark brand={brand} />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
