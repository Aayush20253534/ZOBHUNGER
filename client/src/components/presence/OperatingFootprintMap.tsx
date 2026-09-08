// Simplified WGS84 country outline derived from Natural Earth public-domain data.
const INDIA_OUTLINE =
  "M 334.1 144.2 L 334.8 149.1 L 331.4 151.5 L 332.2 159.6 L 325.4 157.2 L 313.1 166.2 L 313.4 173.7 L 308.1 184.7 L 307.6 191 L 303.4 201.8 L 295.9 198.8 L 295.5 212.3 L 293.4 216.8 L 294.4 222.3 L 289.7 225.4 L 284.7 204.7 L 282 204.7 L 280.5 213.1 L 275.3 206.3 L 278.2 198.9 L 282.5 198.1 L 286.9 187.1 L 281.4 184.8 L 263.5 183.3 L 262.6 174.2 L 258.1 173.5 L 250.5 167.9 L 247.2 176.7 L 254 183.7 L 248.1 188.5 L 246 193.3 L 251.8 196.8 L 250.2 204.7 L 253.5 214.5 L 255 225.2 L 253.6 230 L 247.1 229.8 L 235.4 232.6 L 235.9 242.4 L 230.9 250.1 L 217.1 258.9 L 206.5 274.3 L 189.8 291.1 L 189.8 297.1 L 176.5 305 L 172 305.7 L 169.1 315.6 L 171.6 343.5 L 167.6 355.9 L 167.6 378.1 L 162.6 378.7 L 158.3 388.7 L 161.2 393 L 152.5 396.7 L 149.3 405.6 L 145.5 409.3 L 136.4 397.1 L 128.4 365.7 L 120 346.9 L 115.9 322.4 L 107.3 304.5 L 100.5 262.4 L 100.5 246.6 L 98.7 234.4 L 84.8 242.2 L 78.1 240.6 L 65.6 224.8 L 70.2 220.1 L 67.4 215 L 56.2 203.9 L 62.6 195.1 L 83.5 195.2 L 81.6 184 L 76.3 177.3 L 75.2 167.3 L 69 161.4 L 79.5 147.7 L 90.5 148.7 L 100.5 135 L 106.5 121.8 L 115.7 108.7 L 115.6 99.3 L 111 94 L 106 91 L 105 85 L 99 81 L 96 74 L 100 68 L 104 63 L 103 56 L 110 52 L 113 45 L 121 44 L 126 38 L 134 41 L 141 37 L 149 42 L 156 46 L 164 46 L 172 52 L 180 58 L 186 65 L 183 72 L 175 76 L 172 83 L 166 88 L 164 95 L 156.9 101.6 L 179.5 119.1 L 173.4 125 L 169.7 137.2 L 200.4 155.9 L 213.5 157.6 L 219 164.2 L 237.8 168.5 L 245.7 168.3 L 246.8 163.1 L 245.6 154.8 L 246.3 149.2 L 252.1 146.4 L 253.1 159.4 L 261.8 164.3 L 267.8 162.3 L 283.6 162.8 L 284.3 154.7 L 280.4 150.6 L 288.1 148.9 L 296.8 139.2 L 307.7 130.9 L 315.7 134.1 L 322.5 128.6 L 327 136.7 L 323.8 142.2 L 334.1 144.2 Z";

const MAP_CENTER_X = 195;
const MAP_X_SCALE = 1.14;

function mapX(x: number) {
  return MAP_CENTER_X + (x - MAP_CENTER_X) * MAP_X_SCALE;
}

const markers = [
  {
    name: "Delhi",
    detail: "North",
    x: 142.3,
    y: 139.6,
    tone: "market",
    labelX: 16,
    labelY: -30,
    labelWidth: 72,
  },
  {
    name: "Ghazipur",
    detail: "HQ",
    x: 201.1,
    y: 179.1,
    tone: "hq",
    labelX: -98,
    labelY: -6,
    labelWidth: 86,
  },
  {
    name: "Bihar",
    detail: "East",
    x: 217.9,
    y: 179,
    tone: "market",
    labelX: 18,
    labelY: 12,
    labelWidth: 70,
  },
  {
    name: "Mumbai",
    detail: "West",
    x: 101,
    y: 264.2,
    tone: "market",
    labelX: 16,
    labelY: -8,
    labelWidth: 76,
  },
  {
    name: "Bengaluru",
    detail: "South",
    x: 146,
    y: 343.9,
    tone: "market",
    labelX: -98,
    labelY: -6,
    labelWidth: 86,
  },
] as const;

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
          <g
            className="zb-footprint-country"
            filter="url(#zb-map-shadow)"
            transform={`translate(${MAP_CENTER_X} 0) scale(${MAP_X_SCALE} 1) translate(${-MAP_CENTER_X} 0)`}
          >
            <path className="zb-footprint-map-shape" d={INDIA_OUTLINE} />
            <path className="zb-footprint-map-grid" d={INDIA_OUTLINE} />

            <g className="zb-footprint-islands" aria-hidden="true">
              <circle cx="99" cy="374" r="2.1" />
              <circle cx="96.5" cy="387" r="1.5" />
              <ellipse cx="292" cy="340" rx="2.1" ry="4.1" />
              <ellipse cx="294" cy="354" rx="1.8" ry="3.7" />
              <ellipse cx="296" cy="369" rx="1.6" ry="3.4" />
              <ellipse cx="297.5" cy="386" rx="1.4" ry="3.1" />
              <ellipse cx="299" cy="402" rx="1.25" ry="2.8" />
            </g>
          </g>

          <g className="zb-footprint-routes" aria-hidden="true">
            {markers
              .filter((marker) => marker.tone !== "hq")
              .map((marker) => {
                const startX = mapX(headquarters.x);
                const endX = mapX(marker.x);

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
                transform={`translate(${mapX(marker.x)} ${marker.y})`}
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