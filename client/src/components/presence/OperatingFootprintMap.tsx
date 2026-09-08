const markers = [
  { name: "Delhi", detail: "North", x: 194, y: 128, tone: "market" },
  { name: "Ghazipur", detail: "HQ", x: 255, y: 190, tone: "hq" },
  { name: "Bihar", detail: "East", x: 295, y: 205, tone: "market" },
  { name: "Mumbai", detail: "West", x: 150, y: 270, tone: "market" },
  { name: "Bengaluru", detail: "South", x: 200, y: 360, tone: "market" },
] as const;

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
        viewBox="0 0 420 500"
        role="img"
        aria-labelledby="zb-footprint-map-title zb-footprint-map-desc"
      >
        <title id="zb-footprint-map-title">ZOBHUNGER operating footprint in India</title>
        <desc id="zb-footprint-map-desc">
          Headquarters in Ghazipur with operating presence in Delhi, Mumbai, Bihar and Bengaluru.
        </desc>

        <defs>
          <linearGradient id="zb-india-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
          </linearGradient>
          <filter id="zb-marker-glow" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          className="zb-footprint-map-shape"
          d="M173 42 213 48 235 66 276 73 300 96 318 124 311 145 333 165 326 194 308 214 321 239 304 267 286 282 274 312 251 331 242 356 224 380 216 412 200 452 185 419 172 386 155 354 143 326 121 309 108 282 85 263 72 236 80 209 64 187 72 158 91 145 95 118 119 101 130 77 154 66Z"
        />
        <path className="zb-footprint-map-coast" d="M200 452c-4 10-7 17-8 24" />
        <path className="zb-footprint-map-island" d="M322 318c7 8 7 19 1 29M338 350c4 6 4 14 0 21" />

        {markers.map((marker) => (
          <g
            key={marker.name}
            className={`zb-footprint-marker zb-footprint-marker--${marker.tone}`}
            transform={`translate(${marker.x} ${marker.y})`}
          >
            <circle className="zb-footprint-marker-pulse" r="16" />
            <circle className="zb-footprint-marker-ring" r="9" />
            <circle className="zb-footprint-marker-dot" r="4.4" filter="url(#zb-marker-glow)" />
            <g className="zb-footprint-marker-label" transform="translate(14 -12)">
              <rect width={marker.name === "Bengaluru" ? 88 : 72} height="34" rx="9" />
              <text x="10" y="14" className="zb-footprint-marker-name">{marker.name}</text>
              <text x="10" y="26" className="zb-footprint-marker-detail">{marker.detail}</text>
            </g>
          </g>
        ))}
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
