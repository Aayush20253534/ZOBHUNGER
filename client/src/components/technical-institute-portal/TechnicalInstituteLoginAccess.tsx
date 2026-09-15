"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Building2, ShieldCheck, Wrench } from "lucide-react";
import { PageShell } from "@/components/common/PageShell";
import { TechnicalInstituteActivationForm } from "./TechnicalInstituteActivationForm";
import { TechnicalInstituteLoginForm } from "./TechnicalInstituteLoginForm";

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

  return <>
    <div className="zb-portal-heading">
      <PageShell
        eyebrow="ITI & Polytechnic partner access"
        title={activation ? "Activate your technical institute workspace" : "Technical Institute Partner Portal"}
        description={activation
          ? "Create your secure password to complete institute portal activation."
          : "Dedicated access for approved ITIs, Polytechnic colleges and authorized technical placement teams."}
      />
    </div>
    <div className="zb-login-layout zb-placement-login-layout">
      {activation ? <TechnicalInstituteActivationForm token={activation} /> : <TechnicalInstituteLoginForm />}
      <aside className="zb-account-access-summary">
        <p className="zb-eyebrow">Technical partnership workspace</p>
        <h2>One place for institute-to-industry execution</h2>
        <div className="zb-account-type-list">
          <article><span className="zb-icon-tile"><ShieldCheck /></span><div><h3>Approved access</h3><p>Portal access is issued only after the ITI or Polytechnic partnership is approved.</p></div></article>
          <article><span className="zb-icon-tile"><Wrench /></span><div><h3>Technical talent roster</h3><p>Manage verified trade and diploma profiles, including batch imports.</p></div></article>
          <article><span className="zb-icon-tile"><BadgeCheck /></span><div><h3>Opportunity tracking</h3><p>View qualification-led matches, submissions, selections, joining and reports.</p></div></article>
          <article><span className="zb-icon-tile"><Building2 /></span><div><h3>Institute scoped</h3><p>Every portal action stays limited to your approved institute partnership.</p></div></article>
        </div>
      </aside>
    </div>
  </>;
}
