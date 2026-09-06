import type { Metadata } from "next";
import { PageShell } from "@/components/common/PageShell";

export const metadata: Metadata = { title: "Our Solutions" };

export default function Page() {
  return <PageShell title="Our Solutions" />;
}
