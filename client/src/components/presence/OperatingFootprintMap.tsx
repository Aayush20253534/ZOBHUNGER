// SVG outline traced from the supplied operating-footprint reference.
// Kashmir and Ladakh follow the reference silhouette; all geometry and pins
// share one proportional coordinate system without horizontal stretching.
const INDIA_OUTLINE = [
  "M 91.94 54.49 L 98.3 51.31 L 101.48 45.48 L 106.25 44.95 L 110.49 46.01 L 114.73 43.36",
  "L 121.09 38.06 L 124.27 39.65 L 127.45 37 L 139.64 47.07 L 148.12 53.96 L 150.77 55.02",
  "L 153.95 55.55 L 157.66 58.73 L 162.96 55.02 L 171.44 52.9 L 175.68 51.31 L 177.8 55.02",
  "L 180.98 54.49 L 185.75 57.67 L 182.04 70.39 L 177.8 71.45 L 176.74 73.57 L 176.21 78.34",
  "L 169.85 80.46 L 171.97 84.17 L 169.32 86.82 L 169.85 88.41 L 174.09 87.88 L 173.03 92.65",
  "L 175.15 96.36 L 170.38 99.01 L 168.26 102.72 L 164.02 97.42 L 161.37 102.72 L 164.55 108.02",
  "L 166.14 113.85 L 166.14 117.56 L 170.38 115.97 L 173.56 120.21 L 179.92 125.51 L 185.22 131.34",
  "L 188.93 133.99 L 185.22 138.76 L 184.16 144.06 L 189.46 152.01 L 194.76 158.9 L 202.18 164.2",
  "L 209.07 168.44 L 214.9 170.56 L 218.08 173.21 L 226.56 173.21 L 233.98 173.74 L 237.69 177.45",
  "L 240.34 181.16 L 250.41 182.75 L 255.71 183.81 L 256.77 185.93 L 259.95 183.81 L 268.43 185.93",
  "L 272.14 181.69 L 271.61 173.21 L 272.67 164.2 L 275.85 162.61 L 279.03 162.08 L 280.09 158.9",
  "L 281.68 162.08 L 281.15 167.38 L 281.15 171.62 L 280.09 173.74 L 282.21 175.86 L 292.28 179.04",
  "L 297.05 176.39 L 305 176.92 L 311.89 175.86 L 318.25 175.33 L 321.43 170.03 L 316.66 168.44",
  "L 315.6 166.32 L 316.66 164.73 L 321.96 163.67 L 326.2 161.02 L 332.56 152.54 L 338.39 150.95",
  "L 346.34 142.47 L 352.7 145.12 L 355.88 146.18 L 364.36 139.82 L 366.48 144.06 L 369.13 145.12",
  "L 369.66 147.24 L 367.54 148.3 L 365.95 153.6 L 373.9 154.13 L 379.2 156.78 L 376.55 159.96",
  "L 372.84 162.61 L 375.49 170.03 L 369.66 168.44 L 365.95 167.91 L 360.12 172.15 L 352.7 179.04",
  "L 352.7 188.58 L 350.58 193.35 L 346.34 196.53 L 347.4 199.71 L 345.81 206.07 L 340.51 216.14",
  "L 333.09 212.96 L 333.62 223.56 L 330.44 227.27 L 331.5 232.04 L 329.91 236.81 L 327.26 235.75",
  "L 323.02 240.52 L 321.96 232.57 L 320.37 226.74 L 319.31 217.2 L 316.13 220.38 L 315.07 226.21",
  "L 312.95 227.8 L 310.83 224.09 L 308.71 224.62 L 307.12 217.73 L 309.24 212.96 L 315.6 209.25",
  "L 318.25 203.42 L 320.9 200.77 L 317.72 198.12 L 314.54 199.18 L 305 199.18 L 294.93 197.06",
  "L 291.22 191.76 L 288.04 194.41 L 282.74 189.11 L 280.09 186.99 L 277.44 182.75 L 274.26 186.99",
  "L 274.79 193.35 L 271.61 198.65 L 272.14 205.54 L 275.85 211.37 L 278.5 222.5 L 278.5 228.86",
  "L 280.09 238.4 L 279.56 243.7 L 277.44 246.88 L 275.85 243.17 L 273.73 246.88 L 268.43 247.94",
  "L 266.84 245.29 L 265.25 247.94 L 258.36 250.59 L 258.89 256.95 L 255.18 263.31 L 252 267.55",
  "L 246.7 270.73 L 240.87 273.38 L 238.75 272.85 L 234.51 279.21 L 229.74 285.04 L 223.91 291.4",
  "L 218.61 293.52 L 213.31 299.35 L 208.54 302.53 L 205.36 303.59 L 204.3 306.24 L 204.83 310.48",
  "L 200.06 313.13 L 196.35 314.19 L 193.7 313.66 L 192.11 317.9 L 189.99 321.61 L 185.75 318.43",
  "L 183.1 323.2 L 180.45 329.56 L 182.04 337.51 L 182.57 344.93 L 184.16 352.35 L 181.51 359.24",
  "L 177.8 364.54 L 178.86 371.96 L 178.86 382.03 L 172.5 383.09 L 170.91 387.86 L 168.26 391.04",
  "L 169.85 394.22 L 160.84 397.93 L 158.72 403.23 L 156.07 408 L 152.36 409.59 L 147.59 405.35",
  "L 141.23 398.99 L 137.52 387.33 L 132.75 376.2 L 129.57 369.84 L 124.8 362.42 L 120.56 352.35",
  "L 117.91 345.99 L 115.26 341.22 L 112.08 334.33 L 107.84 328.5 L 101.48 318.43 L 98.3 306.24",
  "L 93.53 294.58 L 90.35 284.51 L 88.23 277.09 L 85.58 268.61 L 86.64 262.25 L 85.05 256.42",
  "L 85.05 250.59 L 83.46 250.59 L 80.28 254.3 L 74.98 257.48 L 70.21 259.6 L 62.26 257.48",
  "L 56.96 252.18 L 51.66 246.35 L 49.54 241.58 L 52.72 240.52 L 54.84 237.87 L 47.95 230.98",
  "L 42.65 225.68 L 40 223.03 L 42.12 220.38 L 44.24 220.91 L 46.89 214.55 L 51.66 215.08",
  "L 58.02 214.02 L 60.14 215.61 L 66.5 212.96 L 69.15 214.55 L 70.74 213.49 L 68.62 205.01",
  "L 67.56 199.18 L 62.79 197.06 L 61.2 194.41 L 62.26 186.46 L 54.84 182.22 L 56.96 177.45",
  "L 60.14 175.33 L 67.03 165.26 L 69.15 166.32 L 71.27 169.5 L 76.57 167.38 L 81.87 167.38",
  "L 86.11 162.08 L 90.88 154.66 L 97.24 151.48 L 101.48 143.53 L 103.07 137.7 L 108.37 136.11",
  "L 110.49 128.69 L 113.67 124.45 L 117.91 120.21 L 118.97 116.5 L 118.97 110.67 L 126.92 105.9",
  "L 125.86 101.13 L 122.15 101.13 L 118.97 96.89 L 107.31 90.53 L 105.72 78.34 L 111.55 72.51",
  "L 106.25 69.33 L 104.13 68.8 L 102.54 67.21 L 100.42 66.68 L 97.77 63.5 L 93 62.97",
  "L 92.47 59.26 L 93 57.14 Z",
].join(" ");

const INDIA_ISLANDS = [
  "M 68.09 334.86 L 70.21 335.92 L 70.21 338.57 L 69.15 340.69 L 67.56 339.63 L 67.03 336.98",
  "Z",
  "M 61.2 345.99 L 62.79 346.52 L 63.32 348.64 L 62.26 351.82 L 60.67 351.29 L 59.61 349.17",
  "L 60.14 347.05 Z",
  "M 68.09 349.17 L 69.68 348.64 L 69.68 350.76 L 67.56 352.35 L 67.03 351.29 Z",
  "M 67.56 353.41 L 69.15 353.94 L 69.68 356.06 L 68.62 357.65 L 67.03 357.12 L 66.5 355.53",
  "Z",
  "M 62.79 359.77 L 64.38 360.3 L 64.38 361.89 L 62.79 362.95 L 61.73 361.36 Z",
  "M 65.97 365.6 L 68.09 366.66 L 68.09 368.78 L 65.97 370.37 L 64.38 369.31 L 63.85 367.72",
  "Z",
  "M 318.78 317.9 L 320.37 320.02 L 320.37 323.73 L 318.25 327.97 L 316.66 325.32 L 316.13 321.61",
  "Z",
  "M 320.37 331.68 L 322.49 333.8 L 323.02 336.98 L 320.9 340.69 L 318.78 339.63 L 318.25 335.92",
  "L 318.78 333.27 Z",
  "M 322.49 347.05 L 324.08 348.11 L 324.61 350.76 L 323.55 353.94 L 321.96 356.06 L 320.9 352.88",
  "L 320.9 349.7 Z",
  "M 324.61 364.01 L 326.2 366.13 L 326.2 369.31 L 324.08 372.49 L 322.49 369.84 L 322.49 367.19",
  "Z",
  "M 326.73 382.03 L 328.32 383.62 L 328.85 386.27 L 327.26 388.92 L 325.67 387.86 L 325.14 385.21",
  "Z",
].join(" ");

const markers = [
  {
    name: "Delhi",
    detail: "North",
    x: 153.42,
    y: 148.3,
    tone: "market",
    labelX: 14,
    labelY: -23,
    labelWidth: 66,
  },
  {
    name: "Ghazipur",
    detail: "HQ",
    x: 203.24,
    y: 192.82,
    tone: "hq",
    labelX: -85,
    labelY: -16,
    labelWidth: 72,
  },
  {
    name: "Bihar",
    detail: "East",
    x: 225.5,
    y: 206.07,
    tone: "market",
    labelX: 15,
    labelY: -17,
    labelWidth: 66,
  },
  {
    name: "Mumbai",
    detail: "West",
    x: 90.35,
    y: 276.56,
    tone: "market",
    labelX: 13,
    labelY: -17,
    labelWidth: 70,
  },
  {
    name: "Bengaluru",
    detail: "South",
    x: 168.79,
    y: 343.87,
    tone: "market",
    labelX: -72,
    labelY: -3,
    labelWidth: 62,
  },
] as const;

// Reuse the same labels in the readable phone key below the SVG.
export const footprintLocations = markers.map(({ name, detail }) => ({ name, detail }));

const headquarters = markers.find((marker) => marker.tone === "hq")!;

export function OperatingFootprintMap({
  compact = false,
  showLegend = true,
}: {
  compact?: boolean;
  showLegend?: boolean;
}) {
  return (
    <div className={`zb-footprint-map${compact ? " zb-footprint-map--compact" : ""}`}>
      <svg
        viewBox="0 0 420 455"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-labelledby="zb-footprint-map-title zb-footprint-map-desc"
      >
        <title id="zb-footprint-map-title">ZOBHUNGER operating footprint in India</title>
        <desc id="zb-footprint-map-desc">
          Headquarters in Ghazipur with operating presence in Delhi, Mumbai, Bihar and Bengaluru.
        </desc>

        <defs>
          <linearGradient id="zb-india-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--zb-map-fill-start)" />
            <stop offset="100%" stopColor="var(--zb-map-fill-end)" />
          </linearGradient>
          <pattern id="zb-map-grid" width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M 18 0 L 0 0 0 18" className="zb-footprint-map-grid-line" />
          </pattern>
          <filter id="zb-map-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity="0.14" />
          </filter>
          <filter id="zb-marker-glow" x="-90%" y="-90%" width="280%" height="280%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="zb-footprint-scene" transform="translate(0 -12)">
          <g className="zb-footprint-country" filter="url(#zb-map-shadow)">
            <path className="zb-footprint-map-shape" d={INDIA_OUTLINE} />
            <path className="zb-footprint-map-grid" d={INDIA_OUTLINE} />

            <g className="zb-footprint-islands" aria-hidden="true">
              <path d={INDIA_ISLANDS} />
            </g>
          </g>

          <g className="zb-footprint-routes" aria-hidden="true">
            {markers
              .filter((marker) => marker.tone !== "hq")
              .map((marker) => {
                const startX = headquarters.x;
                const endX = marker.x;

                return (
                  <path
                    key={marker.name}
                    d={`M ${startX} ${headquarters.y} Q ${(startX + endX) / 2 + 8} ${(headquarters.y + marker.y) / 2 - 8} ${endX} ${marker.y}`}
                  />
                );
              })}
          </g>

          {markers.map((marker) => {
            const leaderX =
              marker.labelX < 0
                ? marker.labelX + marker.labelWidth
                : marker.labelX;
            const leaderY = marker.labelY + 16;

            return (
              <g
                key={marker.name}
                className={`zb-footprint-marker zb-footprint-marker--${marker.tone}`}
                transform={`translate(${marker.x} ${marker.y})`}
              >
                <circle className="zb-footprint-marker-pulse" r="14" />
                <circle className="zb-footprint-marker-ring" r="7.8" />
                <circle
                  className="zb-footprint-marker-dot"
                  r="3.8"
                  filter="url(#zb-marker-glow)"
                />
                <line
                  className="zb-footprint-marker-leader"
                  x1="6"
                  y1="0"
                  x2={leaderX}
                  y2={leaderY}
                />
                <g
                  className="zb-footprint-marker-label"
                  transform={`translate(${marker.labelX} ${marker.labelY})`}
                >
                  <rect width={marker.labelWidth} height="32" rx="8" />
                  <text x="9" y="13" className="zb-footprint-marker-name">
                    {marker.name}
                  </text>
                  <text x="9" y="24" className="zb-footprint-marker-detail">
                    {marker.detail}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {showLegend ? (
        <div className="zb-footprint-map-legend" aria-hidden="true">
          <span><i data-tone="hq" /> Headquarters</span>
          <span><i data-tone="market" /> Market presence</span>
        </div>
      ) : null}
    </div>
  );
}
