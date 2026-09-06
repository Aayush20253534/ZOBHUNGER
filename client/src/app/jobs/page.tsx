import type { Metadata } from "next";
import { PageShell } from "@/components/common/PageShell";

export const metadata: Metadata = { title: "Explore Jobs" };

export default function Page() {
  return <PageShell title="Explore Jobs" />;
}
