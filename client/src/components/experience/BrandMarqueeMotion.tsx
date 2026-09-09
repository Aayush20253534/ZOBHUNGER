"use client";

import type { ReactNode } from "react";

export function BrandMarqueeMotion({ children }: { children: ReactNode }) {
  return (
    <div className="zb-brand-marquee-motion" data-paused={false}>
      <div className="zb-brand-marquee-rows">{children}</div>
      <div className="zb-brand-marquee-controls" />
    </div>
  );
}
