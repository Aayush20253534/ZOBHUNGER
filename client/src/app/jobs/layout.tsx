import type { ReactNode } from "react";
import "@/styles/work.css";

export default function JobsLayout({ children }: { children: ReactNode }) {
  return <div className="zb-work">{children}</div>;
}
