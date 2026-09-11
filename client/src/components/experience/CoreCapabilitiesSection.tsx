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

function CapabilityIconFallback() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

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
          const Icon = Object.prototype.hasOwnProperty.call(
            capabilityIcons,
            capability.id,
          )
            ? capabilityIcons[capability.id as keyof typeof capabilityIcons]
            : undefined;

          return (
            <article key={capability.id} className="zb-core-capability-card">
              <div className="zb-core-capability-topline">
                <span className="zb-core-capability-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="zb-core-capability-icon" aria-hidden="true">
                  {Icon ? <Icon /> : <CapabilityIconFallback />}
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
