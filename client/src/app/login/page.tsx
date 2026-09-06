import {
  ArrowUpRight,
  Building2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PageShell } from "@/components/common/PageShell";
import { getPageMetadata } from "@/lib/page-metadata";
import "@/styles/portal.css";

export const metadata = {
  ...getPageMetadata(
    "Portal Access",
    "The planned entry point for ZOBHUNGER client, worker and administrator accounts.",
    "/login",
  ),
  robots: { index: false, follow: false },
};

const portals = [
  {
    id: "client",
    title: "Client Login",
    audience: "For business teams",
    icon: Building2,
    description:
      "A planned workspace for requirements, candidate review and workforce updates.",
    points: ["Requirements and hiring progress", "Deployment and reporting"],
    href: "/hire-workforce",
    action: "Share a requirement",
  },
  {
    id: "worker",
    title: "Worker Login",
    audience: "For people looking for work",
    icon: UserRound,
    description:
      "A planned account for your profile, applications and assignment information.",
    points: [
      "Profile and application progress",
      "Assignments and work updates",
    ],
    href: "/jobs",
    action: "Explore job pages",
  },
  {
    id: "admin",
    title: "Admin Login",
    audience: "For authorised operations teams",
    icon: ShieldCheck,
    description:
      "Planned internal tools for managing enquiries, people and business delivery.",
    points: ["Enquiry and candidate coordination", "Assignment management"],
    href: "/contact",
    action: "Contact ZOBHUNGER",
  },
] as const;

export default function LoginPage() {
  return (
    <div className="zb-portal-page">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Portal access" }]}
      />
      <div className="zb-portal-heading">
        <PageShell
          eyebrow="Portal access"
          title="Your work. One connected place."
          description="Dedicated spaces for businesses, workers and the team coordinating delivery. Choose an area to see what is planned."
        />
        <p className="zb-portal-status">
          <LockKeyhole aria-hidden="true" />
          <span>
            <strong>Account access is not open yet.</strong> You can explore the
            public website without signing in.
          </span>
        </p>
      </div>
      <section
        className="zb-portal-grid"
        aria-label="Planned portal entry points"
      >
        {portals.map((portal) => {
          const Icon = portal.icon;
          return (
            <article className="zb-portal-card" key={portal.id}>
              <div className="zb-portal-card-top">
                <span className="zb-icon-tile">
                  <Icon aria-hidden="true" />
                </span>
                <span className="zb-chip">Planned</span>
              </div>
              <p className="zb-eyebrow">{portal.audience}</p>
              <h2>{portal.title}</h2>
              <p>{portal.description}</p>
              <ul>
                {portal.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <p className="zb-portal-unavailable">
                <LockKeyhole aria-hidden="true" />
                Sign-in not yet available
              </p>
              <ActionLink href={portal.href} variant="secondary">
                {portal.action}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </ActionLink>
            </article>
          );
        })}
      </section>
      <div className="zb-portal-help">
        <div>
          <h2>Explore the platform direction.</h2>
          <p>
            See how the planned tools connect requirements, people and progress.
          </p>
        </div>
        <ActionLink href="/technology" variant="text">
          Our technology vision
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </ActionLink>
      </div>
    </div>
  );
}
