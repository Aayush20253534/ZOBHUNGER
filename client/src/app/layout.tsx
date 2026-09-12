import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { market } from "@/data/market";
import { site } from "@/data/site";
import {
  organizationJsonLd,
  serializeJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import "./globals.css";
import "@/styles/mobile.css";

export const viewport: Viewport = {
  themeColor: "#8d0d18",
  colorScheme: "light",
};

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
const defaultSocialImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "ZOBHUNGER workforce, sales and business execution platform",
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  category: "business",
  creator: site.name,
  publisher: site.name,
  alternates: { canonical: site.url },
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [{ url: "/Logo/Logo.png", type: "image/png" }],
    apple: [{ url: "/Logo/Logo.png", type: "image/png" }],
  },
  verification: googleVerification ? { google: googleVerification } : undefined,
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
    images: [defaultSocialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
    images: [defaultSocialImage.url],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const structuredData = [organizationJsonLd(), websiteJsonLd()];

  return (
    <html lang="en-IN">
      <body className="zb-site min-h-screen bg-background text-foreground antialiased">
        {structuredData.map((schema) => (
          <script
            key={schema["@type"]}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
          />
        ))}
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  );
}
