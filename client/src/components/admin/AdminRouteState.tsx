import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ShieldAlert } from "lucide-react";

interface AdminRouteStateProps {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  compact?: boolean;
}

export function AdminRouteState({
  icon: Icon = ShieldAlert,
  eyebrow = "Operations workspace",
  title,
  description,
  actionHref = "/admin",
  actionLabel = "Return to overview",
  compact = false,
}: AdminRouteStateProps) {
  return (
    <section className={`zbo-admin-route-state${compact ? " is-compact" : ""}`} aria-labelledby="admin-route-state-title">
      <span className="zbo-admin-route-state-icon"><Icon aria-hidden="true" /></span>
      <div className="zbo-admin-route-state-copy">
        <p className="zbo-eyebrow">{eyebrow}</p>
        <h1 id="admin-route-state-title">{title}</h1>
        <p>{description}</p>
      </div>
      {actionHref && actionLabel && (
        <Link href={actionHref}><ArrowLeft aria-hidden="true" />{actionLabel}</Link>
      )}
    </section>
  );
}
