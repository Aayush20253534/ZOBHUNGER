import type { ReactNode } from "react";
import "@/styles/editorial.css";

export default function BlogsLayout({ children }: { children: ReactNode }) {
  return <div className="zb-editorial">{children}</div>;
}
