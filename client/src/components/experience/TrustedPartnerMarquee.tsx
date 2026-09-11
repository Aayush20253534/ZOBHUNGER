"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useRef, useState } from "react";
import { featuredBrandExperience } from "@/data/brand-experience";
import { brandLogoUrl } from "@/data/brand-logos";
import "@/styles/trusted-partners.css";

// Local brand artwork avoids third-party favicon failures and blurry app icons.
const partnerArtwork: Partial<Record<string, string>> = {
  Amazon: "amazon.png",
  Flipkart: "flipkart.svg",
  Zepto: "zepto.svg",
  Zomato: "zomato.png",
  Swiggy: "swiggy.png",
  Meesho: "meesho.png",
  Delhivery: "delhivery.png",
  Shadowfax: "shadowfax.webp",
  Rapido: "rapido.png",
  Ola: "ola.png",
  Uber: "uber.jpg",
  InDrive: "indrive.png",
  "Oye Rickshaw": "oyerickshaw.jpg",
  Bikayi: "bikayi.jpg",
  Freecharge: "freecharge.png",
  MobiKwik: "mobikwik.png",
  Paytm: "paytm.svg",
  "Google Pay": "google-pay.webp",
  Airtel: "airtel.png",
  "Pine Labs": "pine-labs.svg",
  Tide: "tide.png",
  PagarBook: "pagarbook.webp",
  BharatPe: "Bharatpe.png",
  "Airtel Payments Bank": "airtel_payments_bank.png",
  "Axis Bank": "axis-bank.svg",
  "YES BANK": "yesbank.png",
  Upstox: "upstox.svg",
  "Axis Securities": "Axis_securities.avif",
  "ICICI Securities": "icici securities.png",
  Edelweiss: "edelweiss.jpg",
  "5paisa": "5paisa.png",
  "Motilal Oswal": "motilal-oswal.png",
  PwC: "pwc.png",
  "WhiteHat Jr.": "whitehat jr.png",
  Subway: "subway-logo-png_seeklogo-287348.png",
  "McDonald's": "mcdonalds.svg",
  ASUS: "asus.svg",
  Marlboro: "marlboro.jpeg",
  "Brown-Forman": "brown-forman logo.png",
  "Jim Beam": "Jim-Beam.png",
  "Tilaknagar Industries": "tilaknagar.png",
  Usha: "usha.png",
  "iD Fresh Food": "id fresh food.webp",
};

function PartnerMark({ brand }: { brand: string }) {
  const [failed, setFailed] = useState(false);
  const artwork = partnerArtwork[brand];
  const source = artwork ? `/images/partners/${artwork}` : brandLogoUrl(brand);

  return (
    <span className="zb-partner-mark">
      {failed || !source ? (
        <span className="zb-partner-mark-fallback">{brand}</span>
      ) : (
        <img
          src={source}
          className={brand === "Zomato" ? "zb-partner-mark-dark" : undefined}
          alt={brand}
          width={128}
          height={48}
          loading={artwork ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          ref={(image) => {
            // Also handle a failed request that completed before hydration.
            if (image?.complete && image.naturalWidth === 0) setFailed(true);
          }}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

export function TrustedPartnerMarquee() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const instructionsId = useId();

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const group = track?.querySelector<HTMLElement>(".zb-partner-group");
    if (!viewport || !track || !group) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let groupWidth = 0;
    let position = 0;
    let frame = 0;
    let lastFrame = 0;
    let resumeAt = 0;
    let visible = true;
    let pointer: { id: number; x: number; y: number; dragging: boolean } | null = null;

    // Auto-play and manual input share one position, including across the loop.
    const move = (distance: number) => {
      if (!groupWidth) return;
      position = ((position + distance) % groupWidth + groupWidth) % groupWidth;
      track.style.transform = `translate3d(${-position}px, 0, 0)`;
    };
    const pauseForInput = () => { resumeAt = performance.now() + 1200; };
    const canAnimate = () => visible && !document.hidden && !reducedMotion.matches;
    const animate = (time: number) => {
      frame = 0;
      if (!canAnimate()) return;
      const elapsed = lastFrame ? Math.min(time - lastFrame, 64) : 0;
      lastFrame = time;
      if (!pointer && time >= resumeAt) move((groupWidth * elapsed) / 60000);
      frame = requestAnimationFrame(animate);
    };
    const syncAnimation = () => {
      cancelAnimationFrame(frame);
      lastFrame = 0;
      frame = canAnimate() ? requestAnimationFrame(animate) : 0;
    };
    const measure = () => {
      const width = group.getBoundingClientRect().width;
      if (groupWidth && width) position *= width / groupWidth;
      groupWidth = width;
      move(0);
    };
    const finishDrag = () => {
      if (!pointer) return;
      const { id } = pointer;
      pointer = null;
      delete viewport.dataset.dragging;
      if (viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id);
      pauseForInput();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, dragging: false };
      pauseForInput();
      if (event.pointerType === "mouse") {
        event.preventDefault();
        viewport.focus({ preventScroll: true });
        pointer.dragging = true;
        viewport.dataset.dragging = "true";
        viewport.setPointerCapture(event.pointerId);
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      if (event.pointerType === "mouse" && event.buttons === 0) {
        finishDrag();
        return;
      }
      const distance = pointer.x - event.clientX;
      if (!pointer.dragging) {
        const vertical = Math.abs(pointer.y - event.clientY);
        if (Math.max(Math.abs(distance), vertical) < 6) return;
        // Leave vertical touch gestures to the page and allow pinch zoom.
        if (vertical > Math.abs(distance)) {
          finishDrag();
          return;
        }
        pointer.dragging = true;
        viewport.dataset.dragging = "true";
        viewport.setPointerCapture(event.pointerId);
      }
      move(distance);
      pointer.x = event.clientX;
      pauseForInput();
    };
    const onPointerEnd = (event: PointerEvent) => {
      if (pointer?.id === event.pointerId) finishDrag();
    };
    const onLostPointerCapture = (event: PointerEvent) => {
      // A touch can transfer implicit capture from a logo image to the viewport.
      if (event.target === viewport && !viewport.hasPointerCapture(event.pointerId)) {
        onPointerEnd(event);
      }
    };
    const onWheel = (event: WheelEvent) => {
      // Keep browser zoom gestures intact. Only wheel input over the strip is used.
      if (event.ctrlKey || !event.cancelable || !groupWidth) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientWidth : 1;
      event.preventDefault();
      move(delta * unit);
      pauseForInput();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const step = groupWidth / Math.max(featuredBrandExperience.length, 1);
      let distance: number;
      switch (event.key) {
        case "ArrowLeft": distance = -step; break;
        case "ArrowRight": distance = step; break;
        case "Home": distance = -position; break;
        case "End": distance = groupWidth - step - position; break;
        default: return;
      }
      event.preventDefault();
      move(distance);
      pauseForInput();
    };

    viewport.dataset.interactive = "true";
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(group);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    });
    visibilityObserver.observe(viewport);
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerEnd);
    viewport.addEventListener("pointercancel", onPointerEnd);
    viewport.addEventListener("lostpointercapture", onLostPointerCapture);
    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", finishDrag);
    document.addEventListener("visibilitychange", syncAnimation);
    reducedMotion.addEventListener("change", syncAnimation);
    syncAnimation();

    return () => {
      finishDrag();
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerEnd);
      viewport.removeEventListener("pointercancel", onPointerEnd);
      viewport.removeEventListener("lostpointercapture", onLostPointerCapture);
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", finishDrag);
      document.removeEventListener("visibilitychange", syncAnimation);
      reducedMotion.removeEventListener("change", syncAnimation);
      delete viewport.dataset.interactive;
      track.style.removeProperty("transform");
    };
  }, []);

  return (
    <div className="zb-partner-marquee">
      <span className="zb-partner-instructions" id={instructionsId}>
        Drag or scroll to browse partner logos. You can also use the left and right arrow keys.
      </span>
      <div
        className="zb-partner-viewport"
        ref={viewportRef}
        role="region"
        aria-label="Trusted partner brands"
        aria-describedby={instructionsId}
        tabIndex={0}
      >
        <div className="zb-partner-track" ref={trackRef}>
          {[false, true].map((duplicate) => (
            <ul
              className="zb-partner-group"
              key={String(duplicate)}
              aria-hidden={duplicate || undefined}
            >
              {featuredBrandExperience.map((brand) => (
                <li className="zb-partner-item" key={brand}>
                  <PartnerMark brand={brand} />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
