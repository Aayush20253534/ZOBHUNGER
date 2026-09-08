import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/brand.css";
import "@/styles/business.css";

export const metadata: Metadata = {
  title: { default: "Business workspace | ZOBHUNGER", template: "%s | ZOBHUNGER Business" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export default function BusinessLayout({ children }: { children: ReactNode }) {
  return <div className="zb-biz">{children}</div>;
}
