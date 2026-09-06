import type { ReactNode } from "react";
import "@/styles/editorial.css";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return <div className="zb-editorial">{children}</div>;
}
