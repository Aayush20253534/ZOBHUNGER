import { ImageResponse } from "next/og";
import { site } from "@/data/site";

export const alt = "ZOBHUNGER — Hire. Deploy. Deliver.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 82px",
          background: "#fff8f8",
          color: "#242328",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: 9999,
            right: -170,
            top: -210,
            background: "#c8202f18",
            border: "28px solid #c8202f0c",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              fontSize: 44,
              fontWeight: 800,
              letterSpacing: -2,
            }}
          >
            <span>ZOB</span>
            <span style={{ color: "#c8202f" }}>HUNGER</span>
          </div>
          <span
            style={{
              color: "#615d65",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {site.tagline}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              maxWidth: 900,
              fontSize: 64,
              lineHeight: 1.08,
              fontWeight: 800,
              letterSpacing: -3,
            }}
          >
            Workforce and field execution built around the work ahead.
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              color: "#615d65",
              fontSize: 24,
            }}
          >
            <span>Workforce</span>
            <span style={{ color: "#c8202f" }}>•</span>
            <span>Sales</span>
            <span style={{ color: "#c8202f" }}>•</span>
            <span>Retail</span>
            <span style={{ color: "#c8202f" }}>•</span>
            <span>Business Execution</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
