import {
  BadgeCheck,
  ClipboardCheck,
  Megaphone,
  ScanSearch,
  Store,
  UsersRound,
} from "lucide-react";
import {
  capabilitySummary,
  coreCapabilities,
} from "@/data/core-capabilities";

const capabilityIcons = {
  "manpower-deployment": UsersRound,
  "field-audit": ClipboardCheck,
  "sampling-activation": Megaphone,
  "lead-generation": ScanSearch,
  "consumer-engagement": BadgeCheck,
  "seller-onboarding-training": Store,
} as const;

export function CoreCapabilitiesSection() {
  return (
    <section
      className="zb-experience-section zb-core-capabilities"
      aria-labelledby="core-capabilities-title"
    >
      <div className="zb-experience-section-heading">
        <div>
          <span className="zb-eyebrow">{capabilitySummary.eyebrow}</span>
          <h2 id="core-capabilities-title">{capabilitySummary.title}</h2>
        </div>
        <p>{capabilitySummary.description}</p>
      </div>

      <div className="zb-core-capability-grid">
        {coreCapabilities.map((capability, index) => {
          const Icon = capabilityIcons[capability.id as keyof typeof capabilityIcons];
          return (
            <article key={capability.id} className="zb-core-capability-card">
              <div className="zb-core-capability-topline">
                <span className="zb-core-capability-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="zb-core-capability-icon" aria-hidden="true">
                  <Icon />
                </span>
              </div>
              <h3>{capability.title}</h3>
              <p>{capability.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
