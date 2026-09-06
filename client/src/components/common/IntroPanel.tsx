import type { ReactNode } from "react";

type IntroPanelProps = {
  id: string;
  icon: ReactNode;
  title: string;
  eyebrow?: string;
  description?: string;
  items: readonly { label: string; value: string }[];
};

/** A shared, readable brief card for the opening of public pages. */
export function IntroPanel({
  id,
  icon,
  title,
  eyebrow,
  description,
  items,
}: IntroPanelProps) {
  return (
    <aside className="zb-intro-panel" aria-labelledby={id}>
      <div className="zb-intro-panel-top">
        <span className="zb-icon-tile" aria-hidden="true">
          {icon}
        </span>
        <span className="zb-eyebrow">
          {eyebrow ?? "Your requirement, in focus"}
        </span>
      </div>
      <h2 id={id}>{title}</h2>
      {description && (
        <p className="zb-intro-panel-description">{description}</p>
      )}
      <dl>
        {items.map((item, index) => (
          <div key={item.label}>
            <dt>
              <span className="zb-intro-fact-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              {item.label}
            </dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
