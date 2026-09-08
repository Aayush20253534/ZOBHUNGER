"use client";

import { Pause, Play } from "lucide-react";
import { useState, type ReactNode } from "react";

export function BrandMarqueeMotion({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  const Icon = paused ? Play : Pause;

  return (
    <div className="zb-brand-marquee-motion" data-paused={paused}>
      <div className="zb-brand-marquee-rows">{children}</div>
      <div className="zb-brand-marquee-controls">
        <button
          type="button"
          className="zb-brand-marquee-toggle"
          onClick={() => setPaused((current) => !current)}
          aria-label={paused ? "Resume brand logo animation" : "Pause brand logo animation"}
        >
          <Icon aria-hidden="true" />
          {paused ? "Resume logos" : "Pause logos"}
        </button>
      </div>
    </div>
  );
}
