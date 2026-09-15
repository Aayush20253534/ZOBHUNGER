"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCheck, Building2, ShieldCheck, Wrench } from "lucide-react";
import { TechnicalInstituteActivationForm } from "./TechnicalInstituteActivationForm";
import { TechnicalInstituteLoginForm } from "./TechnicalInstituteLoginForm";

const workspaceHighlights = [
  {
    title: "Technical talent roster",
    icon: Wrench,
    copy: "Manage verified ITI trade and diploma profiles in one institute-scoped workspace.",
  },
  {
    title: "Opportunity tracking",
    icon: BadgeCheck,
    copy: "Review qualification-led matches, submissions, selections and joining progress.",
  },
  {
    title: "Placement reporting",
    icon: Building2,
    copy: "Keep institute hiring activity and placement reporting organised in one place.",
  },
] as const;

export function TechnicalInstituteLoginAccess() {
  const [activation, setActivation] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      setActivation(params.get("activation"));
    };

    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  return (
    <section
      className="zb-portal-access-shell"
      aria-label="Technical Institute Partner Portal access"
    >
      <div className="zb-portal-access-intro">
        <div className="zb-portal-access-kicker">
          <span aria-hidden="true" />
          ITI & Polytechnic partner access
        </div>

        <h1>
          {activation ? "Secure activation." : "Technical talent."}
          <span>{activation ? "Built for approved institutes." : "One secure workspace."}</span>
        </h1>

        <p className="zb-portal-access-copy">
          {activation
            ? "Create your password to activate the approved institute workspace linked to your official account."
            : "A dedicated workspace for approved ITIs and Polytechnic colleges to manage student talent, opportunities and placement progress."}
        </p>

        <div className="zb-portal-account-grid" aria-label="Technical institute workspace features">
          {workspaceHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title}>
                <span className="zb-portal-account-icon" aria-hidden="true">
                  <Icon />
                </span>
                <div>
                  <h2>{item.title}</h2>
                  <p>{item.copy}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="zb-portal-trust-note">
          <ShieldCheck aria-hidden="true" />
          <span>
            <strong>Institute-scoped access</strong>
            Every action stays restricted to the approved institute partnership and authorised representatives.
          </span>
        </div>
      </div>

      <div className="zb-portal-login-column">
        <div className="zb-portal-login-status">
          <span aria-hidden="true" />
          {activation ? "Secure account activation" : "Approved partner access"}
        </div>
        {activation ? (
          <TechnicalInstituteActivationForm token={activation} />
        ) : (
          <TechnicalInstituteLoginForm />
        )}
        <p className="zb-portal-login-help">
          Need help accessing your institute account? <Link href="/contact">Contact support</Link>
        </p>
      </div>
    </section>
  );
}
