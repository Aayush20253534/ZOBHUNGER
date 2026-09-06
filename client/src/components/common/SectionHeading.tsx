import type { ReactNode } from "react";

export function SectionHeading({
  title,
  eyebrow,
  description,
  action,
  id,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="zb-section-heading">
      <div>
        {eyebrow && <span className="zb-eyebrow">{eyebrow}</span>}
        <h2 id={id}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
