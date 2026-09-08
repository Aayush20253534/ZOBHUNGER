"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Building2, CheckCircle2, ExternalLink, MapPin, Pencil } from "lucide-react";
import { useBusiness } from "./BusinessProvider";
import { BusinessHeading, profileCompletion } from "./BusinessUI";
import { BusinessProfileForm } from "./BusinessProfileForm";

export function BusinessCompany() {
  const { user, profile } = useBusiness();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const website = profile?.website && /^https?:\/\//i.test(profile.website) ? profile.website : null;
  return <>
    <BusinessHeading eyebrow="COMPANY PROFILE" title="The business behind your team." copy="Keep your company, contact and location details together." />
    {saved && !editing && <p className="zb-biz-success-inline" role="status"><CheckCircle2 aria-hidden="true" />Your company details have been saved.</p>}
    {editing ? <BusinessProfileForm editing onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); setSaved(true); }} /> : !profile ? <div className="zb-biz-card zb-biz-empty"><span className="zb-biz-icon zb-biz-icon--large"><Building2 aria-hidden="true" /></span><h2>Give your company a home.</h2><p>Add your company name, industry and contact details to complete your workspace setup.</p><Link href="/business/onboarding" className="zb-biz-button">Set up company profile<ArrowRight aria-hidden="true" /></Link></div> : <section className="zb-biz-company-grid" aria-label="Company profile">
      <article className="zb-biz-company-identity"><div className="zb-biz-company-monogram" aria-hidden="true">{profile.companyName.slice(0, 2).toUpperCase()}</div><p className="zb-biz-eyebrow">YOUR COMPANY</p><h2>{profile.companyName}</h2><p>{profile.industry || "Add your industry"}</p><span className="zb-biz-profile-location"><MapPin aria-hidden="true" />{[profile.city, profile.state].filter(Boolean).join(", ") || "Location not added"}</span><span className="zb-biz-pill"><Building2 aria-hidden="true" />{profileCompletion(profile) === 100 && profile.onboardedAt ? "Company setup complete" : "Company setup in progress"}</span></article>
      <article className="zb-biz-card"><div className="zb-biz-card-heading"><h2>Company & contact</h2><button type="button" className="zb-biz-button zb-biz-button--secondary" onClick={() => { setSaved(false); setEditing(true); }}><Pencil aria-hidden="true" />Edit profile</button></div><dl className="zb-biz-details"><div><dt>Company name</dt><dd>{profile.companyName}</dd></div><div><dt>Contact person</dt><dd>{profile.contactPerson}</dd></div><div><dt>Account email</dt><dd>{user.email}</dd></div><div><dt>Phone</dt><dd>{profile.phone || "Not added"}</dd></div><div><dt>Industry</dt><dd>{profile.industry || "Not added"}</dd></div><div><dt>Location</dt><dd>{[profile.city, profile.state].filter(Boolean).join(", ") || "Not added"}</dd></div><div><dt>Website</dt><dd>{website ? <a href={website} target="_blank" rel="noopener noreferrer" className="zb-biz-text-link">{website}<ExternalLink aria-label="Opens in a new tab" /></a> : "Not added"}</dd></div></dl><p className="zb-biz-field-hint">Your account email is managed separately from your company contact details.</p></article>
    </section>}
  </>;
}
