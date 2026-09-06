import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignSystemPreview } from "@/components/dev/DesignSystemPreview";

export const metadata: Metadata = {
  title: "Design system preview",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  // This review surface is available through `next dev` only.
  if (process.env.NODE_ENV === "production") notFound();
  return <DesignSystemPreview />;
}
