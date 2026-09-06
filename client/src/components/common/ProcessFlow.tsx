"use client";

import { useId, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Check, Flag } from "lucide-react";
import { ActionButton } from "@/components/common/ActionButton";
import { ActionLink } from "@/components/common/ActionLink";
import "@/styles/process.css";

export type ProcessStep = {
  title: string;
  description: string;
  checkpoint?: string;
};

export function ProcessFlow({
  steps,
  label,
  action = { href: "/hire-workforce", label: "Share your requirement" },
  planned = false,
}: {
  steps: readonly ProcessStep[];
  label: string;
  action?: { href: string; label: string };
  planned?: boolean;
}) {
  const id = useId();
  const [selected, setSelected] = useState(0);
  const index = Math.min(selected, Math.max(0, steps.length - 1));
  const step = steps[index];
  if (!step) return null;

  return (
    <div className="zb-process-flow">
      <div className="zb-process-toolbar">
        <p>{planned ? "Planned journey" : "The delivery journey"}</p>
        <span>Select a step to explore the details</span>
      </div>
      <ol
        className="zb-process-track"
        role="list"
        aria-label={label}
        style={{ "--zb-step-count": steps.length } as CSSProperties}
      >
        {steps.map((item, position) => (
          <li key={item.title}>
            <button
              type="button"
              id={`${id}-step-${position}`}
              aria-pressed={index === position}
              aria-controls={`${id}-detail`}
              onClick={() => setSelected(position)}
            >
              <span className="zb-process-marker" aria-hidden="true">
                {String(position + 1).padStart(2, "0")}
              </span>
              <span className="zb-process-step-title">
                <span className="zb-process-step-label">
                  Step {position + 1}
                </span>
                {item.title}
              </span>
              <ArrowRight
                className="zb-process-step-arrow"
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ol>
      <div
        className="zb-process-detail"
        id={`${id}-detail`}
        role="region"
        aria-labelledby={`${id}-detail-title`}
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="zb-process-detail-copy">
          <span className="zb-eyebrow">
            {planned ? "Planned step" : "Step"}{" "}
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(steps.length).padStart(2, "0")}
          </span>
          <h3 id={`${id}-detail-title`}>{step.title}</h3>
          <p>{step.description}</p>
        </div>
        {step.checkpoint && (
          <div className="zb-process-outcome">
            <Flag aria-hidden="true" />
            <span>Working toward</span>
            <p>{step.checkpoint}</p>
            <span className="zb-process-outcome-note">
              <Check aria-hidden="true" />
              Details agreed for each assignment
            </span>
          </div>
        )}
      </div>
      <div className="zb-process-controls">
        <p>
          {planned
            ? "Portal features are planned for a future release."
            : "One connected plan, from the first brief onward."}
        </p>
        <div>
          <ActionButton
            variant="outline"
            disabled={index === 0}
            onClick={() => setSelected(index - 1)}
            aria-label="Previous process step"
          >
            <ArrowLeft aria-hidden="true" />
            Previous
          </ActionButton>
          <ActionButton
            disabled={index === steps.length - 1}
            onClick={() => setSelected(index + 1)}
            aria-label="Next process step"
          >
            Next step
            <ArrowRight aria-hidden="true" />
          </ActionButton>
          <ActionLink href={action.href} variant="text">
            {action.label}
            <ArrowRight aria-hidden="true" />
          </ActionLink>
        </div>
      </div>
    </div>
  );
}
