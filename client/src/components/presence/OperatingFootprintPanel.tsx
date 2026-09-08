import { Navigation } from "lucide-react";
import { OperatingFootprintMap } from "@/components/presence/OperatingFootprintMap";
import "@/styles/presence.css";
import "@/styles/presence-map.css";

export function OperatingFootprintPanel({
  className = "",
}: {
  className?: string;
}) {
  return (
    <aside
      className={`zb-presence-network ${className}`.trim()}
      aria-label="ZOBHUNGER operating footprint"
    >
      <div className="zb-presence-network-header">
        <div>
          <span className="zb-eyebrow">Operating footprint</span>
          <h2>One coordinated network, built around execution.</h2>
        </div>

        <div className="zb-presence-network-status">
          <span className="zb-presence-network-icon" aria-hidden="true">
            <Navigation />
          </span>

          <div className="zb-presence-network-status-copy">
            <small>Execution network</small>
            <span className="zb-presence-network-status-value">
              <strong>5</strong>
              <span>coordination points</span>
            </span>
          </div>
        </div>
      </div>

      <div className="zb-presence-map-wrap">
        <OperatingFootprintMap showLegend={false} />
      </div>

      <div className="zb-presence-network-footer">
        <span>
          <i data-tone="hq" /> Headquarters
        </span>
        <span>
          <i data-tone="market" /> Branch / market presence
        </span>
        <small>Workforce + field execution coordination</small>
      </div>
    </aside>
  );
}
