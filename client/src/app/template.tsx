import type { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <div id="main-content" tabIndex={-1} className="zb-page-content">
      {children}
    </div>
  );
}
