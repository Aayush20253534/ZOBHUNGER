import type { ReactNode } from "react";

export interface PageShellProps {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageShell({
  title,
  eyebrow,
  description,
  actions,
  children,
}: PageShellProps) {
  return (
    <div>
      <header className="zb-page-heading">
        {eyebrow && <span className="zb-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p className="zb-page-description">{description}</p>}
        {actions && <div className="zb-page-actions">{actions}</div>}
      </header>
      {children}
    </div>
  );
}
