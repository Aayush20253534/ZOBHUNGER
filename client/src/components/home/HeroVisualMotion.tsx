"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";

function subscribeToVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

const isVisible = () => document.visibilityState === "visible";
const serverSnapshot = () => false;

/** Only the motion control hydrates; imagery and copy arrive from the server. */
export function HeroVisualMotion({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  // Continuous motion starts with a working pause button, and stops in hidden tabs.
  const ready = useSyncExternalStore(subscribeToVisibility, isVisible, serverSnapshot);

  return (
    <figure
      id="home-hero-visual"
      className="zb-home-hero-figure"
      data-motion-ready={ready}
      data-motion-paused={paused}
    >
      {children}
    </figure>
  );
}
