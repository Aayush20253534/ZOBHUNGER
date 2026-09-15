"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, BadgeCheck, BriefcaseBusiness, FileCheck2, GraduationCap, LogOut, MapPin, UsersRound, Wrench } from "lucide-react";
import { ApiError } from "@/lib/api";
import { logout } from "@/services/auth.service";
import { getTechnicalInstitutePortalDashboard, type TechnicalPortalDashboard } from "@/services/technical-institute-portal.service";

const statusText = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

export function TechnicalInstitutePortalDashboard() {
  const router = useRouter();
  const [data, setData] = useState<TechnicalPortalDashboard | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getTechnicalInstitutePortalDashboard().then((response) => { if (active) setData(response.data); }).catch((caught) => {
      if (!active) return;
      setError(caught instanceof ApiError ? caught.message : "Unable to load the technical institute workspace.");
    });
    return () => { active = false; };
  }, []);

  async function signOut() {
    await logout();
    router.push("/technical-institute-login");
    router.refresh();
  }

  if (!data && !error) return <div className="zti-portal-loading">Loading technical institute workspace…</div>;
  if (error) return <div className="zb-login-error">{error}</div>;
  if (!data) return null;

  const profile = data.profile;
  return <div className="zti-portal-shell">
    <header className="zti-portal-hero">
      <div className="zti-portal-hero-copy"><span className="zti-portal-kicker"><Wrench /> ITI & Polytechnic College Cell</span><h1>{profile.institutionName}</h1><p><MapPin />{profile.city}, {profile.state}<span>•</span>{profile.affiliationBody.toUpperCase()}<span>•</span>{profile.partnershipCode}</p></div>
      <button className="zti-portal-signout" type="button" onClick={signOut}><LogOut />Sign out</button>
    </header>

    <section className="zti-portal-metrics" aria-label="Technical institute workspace summary">
      <Link href="/technical-institute-portal/students"><span><UsersRound /></span><div><small>Verified talent</small><strong>{data.students.verified.toLocaleString("en-IN")}</strong><p>{data.students.pending} awaiting verification</p></div></Link>
      <Link href="/technical-institute-portal/opportunities"><span><BriefcaseBusiness /></span><div><small>Open opportunities</small><strong>{data.opportunities.open.toLocaleString("en-IN")}</strong><p>Jobs, internships, apprenticeships & training</p></div></Link>
      <Link href="/technical-institute-portal/applications"><span><FileCheck2 /></span><div><small>Applications</small><strong>{data.applications.total.toLocaleString("en-IN")}</strong><p>{data.applications.shortlisted} shortlisted · {data.applications.selected} selected</p></div></Link>
      <Link href="/technical-institute-portal/reports"><span><BarChart3 /></span><div><small>Joined</small><strong>{data.applications.joined.toLocaleString("en-IN")}</strong><p>Placement and hiring reporting</p></div></Link>
    </section>

    <div className="zti-portal-dashboard-grid">
      <section className="zti-portal-card zti-portal-recent">
        <div className="zti-portal-section-head"><div><small>Live pipeline</small><h2>Recent candidate activity</h2></div><Link href="/technical-institute-portal/applications">View all</Link></div>
        {data.recentApplications.length ? <div className="zti-portal-activity-list">{data.recentApplications.map((item) => <article key={item.id}><span className="zti-portal-avatar">{item.student.fullName.slice(0, 1).toUpperCase()}</span><div><strong>{item.student.fullName}</strong><p>{item.opportunity.title} · {item.opportunity.employerName}</p><small>{item.student.tradeBranch} · {item.student.passingYear} batch · {item.matchScore}% match</small></div><span className="zti-portal-status" data-status={item.status}>{statusText(item.status)}</span></article>)}</div> : <div className="zti-portal-empty"><FileCheck2 /><strong>No candidate applications yet</strong><p>Match verified students to active technical opportunities to start the pipeline.</p></div>}
      </section>

      <aside className="zti-portal-card zti-portal-profile-card">
        <div className="zti-portal-section-head"><div><small>Approved institute</small><h2>Partnership profile</h2></div><BadgeCheck /></div>
        <dl><div><dt>Representative</dt><dd>{profile.contactPersonName}</dd></div><div><dt>Designation</dt><dd>{profile.designation}</dd></div><div><dt>Primary batch</dt><dd>{profile.passingYear}</dd></div><div><dt>Final-year strength</dt><dd>{profile.finalYearStudents.toLocaleString("en-IN")}</dd></div><div><dt>Technical disciplines</dt><dd>{profile.tradesBranches}</dd></div></dl>
      </aside>
    </div>

    <section className="zti-portal-card zti-portal-trades">
      <div className="zti-portal-section-head"><div><small>Roster intelligence</small><h2>Leading technical trades / branches</h2></div><GraduationCap /></div>
      <div>{data.topTrades.length ? data.topTrades.map((item) => <span key={item.tradeBranch}><strong>{item.count}</strong>{item.tradeBranch}</span>) : <p>Trade distribution will appear after students are onboarded.</p>}</div>
    </section>
  </div>;
}
