import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { market } from "@/data/market";
import { site } from "@/data/site";
import { solutions } from "@/data/solutions";
import "./globals.css";
import "@/styles/mobile.css";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  category: "business",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: market.primaryMarket.locale,
    siteName: site.name,
    url: site.url,
    title: site.name,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  logo: `${site.url}/Logo/Logo.png`,
  description: site.description,
  slogan: site.tagline,
  email: site.publicContact.email,
  telephone: site.publicContact.phoneLabel,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.publicContact.streetAddress,
    addressLocality: site.publicContact.addressLocality,
    addressRegion: site.publicContact.addressRegion,
    postalCode: site.publicContact.postalCode,
    addressCountry: site.publicContact.addressCountry,
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: site.publicContact.email,
    telephone: site.publicContact.phoneLabel,
    areaServed: market.operatingCountries.map((country) => country.name),
  },
  knowsAbout: Array.from(
    new Set(
      solutions.flatMap((solution) => [
        solution.title,
        ...solution.services,
      ]),
    ),
  ),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="zb-site min-h-screen bg-background text-foreground antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c") }}
        />
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  );
}
