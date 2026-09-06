import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: { default: "ZOBHUNGER", template: "%s | ZOBHUNGER" },
  description: "Workforce, sales and business execution solutions.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Navbar />
        <main className="mx-auto min-h-[70vh] max-w-6xl px-6 py-12">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
