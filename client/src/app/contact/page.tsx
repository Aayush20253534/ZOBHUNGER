import type { Metadata } from "next";
import { PageShell } from "@/components/common/PageShell";

export const metadata: Metadata = { title: "Contact Us" };

export default function Page() {
  return <PageShell title="Contact Us" />;
}
