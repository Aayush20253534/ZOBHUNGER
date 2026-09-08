"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, Building2, Check, CheckCircle2, ClipboardList, MapPin, Pencil, ShieldCheck } from "lucide-react";
import { ExecutionImage } from "@/components/common/ExecutionImage";
import { executionVisuals } from "@/data/execution-visuals";
import { useBusiness } from "./BusinessProvider";
import { BusinessHeading, profileCompletion } from "./BusinessUI";

export function BusinessOverview() {
  const { profile } = useBusiness();
  const completion = profileCompletion(profile);
  const ready = completion === 100 && Boolean(profile?.onboardedAt);
  return <>
    <BusinessHeading eyebrow="YOUR BUSINESS, IN ONE PLACE" title={profile?.contactPerson ? `Welcome, ${profile.contactPerson}.` : "Welcome to your workspace."} copy="A clear company profile is the starting point for your next team." />
    <section className="zb-biz-welcome-grid" aria-label="Get started">
      <div className="zb-biz-welcome">
        <span className="zb-biz-pill"><ShieldCheck aria-hidden="true" />Business account active</span><h2>Good people.<br />A clear starting point.</h2><p>{ready ? "Your company details are in place. Share the roles, locations and timeline for your next requirement." : "Tell us who you are, where you work and who we should speak to. We'll keep the details together here."}</p>
        <Link className="zb-biz-button" href={ready ? "/hire-workforce" : "/business/onboarding"}>{ready ? "Share a workforce requirement" : "Set up your company"}<ArrowRight aria-hidden="true" /></Link>
      </div>
      <figure className="zb-biz-work-image"><ExecutionImage visual={executionVisuals["operations-coordination"]} sizes="(max-width: 800px) 100vw, 460px" priority /><figcaption><span>From the brief to the field</span><small>AI-generated illustration</small></figcaption></figure>
    </section>
    <section className="zb-biz-overview-grid" aria-label="Company and next steps">
      <article className="zb-biz-card"><div className="zb-biz-card-heading"><span className="zb-biz-icon"><Building2 aria-hidden="true" /></span><h2>Your company</h2><Link href="/business/company" className="zb-biz-icon-link" aria-label="View or edit company profile"><Pencil aria-hidden="true" /></Link></div>
        <div className="zb-biz-profile-progress"><div className="zb-biz-ring" style={{ "--completion": `${completion}%` } as CSSProperties} role="img" aria-label={`Company profile ${completion}% complete`}><span>{completion}%</span></div><div><h3>{profile?.companyName || "Add your company"}</h3><p>{ready ? "Company setup complete" : "Complete your company setup"}</p></div></div>
        <div className="zb-biz-profile-location"><MapPin aria-hidden="true" />{[profile?.city, profile?.state].filter(Boolean).join(", ") || "Add your business location"}</div><Link href={ready ? "/business/company" : "/business/onboarding"} className="zb-biz-text-link">{ready ? "View company profile" : "Continue company setup"}<ArrowRight aria-hidden="true" /></Link>
      </article>
      <article className="zb-biz-card"><div className="zb-biz-card-heading"><span className="zb-biz-icon"><ClipboardList aria-hidden="true" /></span><h2>Your starting checklist</h2></div><ol className="zb-biz-checklist">
        <li data-complete="true"><span><Check aria-hidden="true" /></span><div><h3>Create your business account</h3><p>Your sign-in is ready.</p></div><CheckCircle2 aria-label="Complete" /></li>
        <li data-complete={ready}><span>{ready ? <Check aria-hidden="true" /> : "2"}</span><div><h3><Link href={ready ? "/business/company" : "/business/onboarding"}>Add your company details</Link></h3><p>{ready ? "Your team knows who to contact." : "Company, contact and location."}</p></div></li>
        <li><span>3</span><div><h3><Link href="/hire-workforce">Share your next requirement</Link></h3><p>Tell us the work you need done.</p></div><ArrowRight aria-hidden="true" /></li>
      </ol></article>
    </section>
    <div className="zb-biz-help-strip"><ShieldCheck aria-hidden="true" /><p>Company details are visible to your account and authorised ZOBHUNGER operations staff.</p><Link href="/solutions">Explore our solutions<ArrowRight aria-hidden="true" /></Link></div>
  </>;
}
