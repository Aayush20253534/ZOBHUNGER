import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { site } from "@/data/site";
import { contactDetails } from "@/data/contact";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  category: "business",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: site.name,
    url: site.url,
    title: site.name,
    description: site.description,
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  description: site.description,
  slogan: site.tagline,
  email: contactDetails.businessEmail,
  telephone: contactDetails.phone?.label,
  address: contactDetails.officeAddress
    ? {
        "@type": "PostalAddress",
        streetAddress: "Vijay Villa, 258, Nawapura, CISF Colony, Opium Factory Road",
        addressLocality: "Ghazipur",
        addressRegion: "Uttar Pradesh",
        postalCode: "233001",
        addressCountry: "IN",
      }
    : undefined,
  knowsAbout: [
    "Workforce solutions",
    "Recruitment",
    "Sales force execution",
    "Promoter management",
    "Retail execution",
    "Brand activation",
    "Business operations",
    "Gig workforce",
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Navbar />
        <main className="mx-auto min-h-[70vh] max-w-6xl px-6 py-12">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
