import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/worker.css";

export const metadata: Metadata = {
  title: { default: "Worker Space", template: "%s | ZOBHUNGER" },
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function WorkerLayout({ children }: { children: ReactNode }) {
  return <div className="zw">{children}</div>;
}
