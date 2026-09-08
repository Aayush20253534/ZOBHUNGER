"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

function subscribeToVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

const isVisible = () => document.visibilityState === "visible";
const serverSnapshot = () => false;

/** Only visibility tracking hydrates; imagery and copy arrive from the server. */
export function HeroVisualMotion({ children }: { children: ReactNode }) {
  const [inView, setInView] = useState(true);
  const figureRef = useRef<HTMLElement>(null);
  // Continuous motion stops in hidden tabs and outside the viewport.
  const ready = useSyncExternalStore(subscribeToVisibility, isVisible, serverSnapshot);

  useEffect(() => {
    const figure = figureRef.current;
    if (!figure || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    });
    observer.observe(figure);
    return () => observer.disconnect();
  }, []);

  return (
    <figure
      ref={figureRef}
      id="home-hero-visual"
      className="zb-home-hero-figure"
      data-motion-ready={ready}
      data-motion-visible={inView}
    >
      {children}
    </figure>
  );
}
