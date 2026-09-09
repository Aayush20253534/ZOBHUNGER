"use client";
import Link from "next/link";
import { ArrowUpRight, Banknote, Bookmark, BriefcaseBusiness, CalendarCheck2, CheckCircle2, Clock3, FileCheck2, MapPin, Search, UserRound, WalletCards } from "lucide-react";
import { useWorker } from "./WorkerProvider";
import { WorkerEmpty, WorkerHeading, WorkerProgress } from "./WorkerUI";
import { dateLabel, ReadState, stageLabel, Status, timeLabel, useWorkflowRead } from "./WorkflowUI";
import type { WorkerDashboardData } from "@/types/worker-finance.types";

const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paise / 100);
const quick = [
  ["/worker/jobs", "Find work", Search], ["/worker/saved-jobs", "Saved jobs", Bookmark], ["/worker/applications", "Applications", FileCheck2],
  ["/worker/assignments", "Assignments", BriefcaseBusiness], ["/worker/attendance", "Attendance", CalendarCheck2], ["/worker/earnings", "Earnings", WalletCards], ["/worker/profile", "Profile & CV", UserRound],
] as const;
export function WorkerDashboard() {
  const { profile, completion } = useWorker();
  const read = useWorkflowRead<WorkerDashboardData>("/workers/dashboard");
  const name = profile?.fullName?.split(/\s+/)[0] || "there";
  return <ReadState {...read}>{read.data && <div className="zwd-stack">
    <section className="zwd-welcome"><div><p className="zw-eyebrow">WORKER DASHBOARD</p><h1>Welcome back, {name}.</h1><p>See what needs your attention, what comes next and what has been approved.</p></div><WorkerProgress completion={completion} compact /></section>
    <NextActions data={read.data} completion={completion.percent} />
    <section className="zwd-metrics" aria-label="Worker overview">
      <Metric icon={FileCheck2} label="Applications" value={String(read.data.applications.total)} copy="Across your submitted roles" />
      <Metric icon={BriefcaseBusiness} label="Active assignments" value={String(read.data.assignments.currentTotal)} copy={`${read.data.assignments.upcomingTotal} upcoming`} />
      <Metric icon={CalendarCheck2} label="Attendance review" value={String(read.data.attendance.pending)} copy="Awaiting operations decision" />
      <Metric icon={Banknote} label="Approved earnings" value={money(read.data.earnings.approvedPaise)} copy={`${money(read.data.earnings.outstandingPaise)} outstanding`} />
    </section>
    <div className="zwd-grid">
      <section className="zw-card zwd-panel"><div className="zwd-panel-head"><div><p className="zw-eyebrow">NEXT SHIFT</p><h2>Your schedule at a glance</h2></div><Clock3 aria-hidden="true" /></div>{read.data.assignments.nextShift ? <div className="zwd-shift"><div className="zwd-date"><strong>{new Date(`${read.data.assignments.nextShift.date}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "2-digit", timeZone: "Asia/Kolkata" })}</strong><span>{new Date(`${read.data.assignments.nextShift.date}T00:00:00+05:30`).toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" })}</span></div><div><h3>{read.data.assignments.nextShift.role}</h3><p>{read.data.assignments.nextShift.company}</p><p><MapPin aria-hidden="true" />{read.data.assignments.nextShift.location}</p><p><Clock3 aria-hidden="true" />{timeLabel(read.data.assignments.nextShift.startAt)} – {timeLabel(read.data.assignments.nextShift.endAt)} IST{read.data.assignments.nextShift.overnight ? " · Ends next day" : ""}</p><p><UserRound aria-hidden="true" />{read.data.assignments.nextShift.supervisor || "Supervisor via operations"}</p></div><Link className="zw-text-button" href={`/worker/assignments/${read.data.assignments.nextShift.assignmentId}?date=${read.data.assignments.nextShift.date}`}>Open shift<ArrowUpRight aria-hidden="true" /></Link></div> : <WorkerEmpty icon={CalendarCheck2} title="No confirmed shift ahead" copy="When operations confirms an assignment and schedule, your next working shift will appear here." href="/worker/applications" label="Review applications" />}</section>
      <section className="zw-card zwd-panel"><div className="zwd-panel-head"><div><p className="zw-eyebrow">HIRING UPDATES</p><h2>Recent applications</h2></div><FileCheck2 aria-hidden="true" /></div>{read.data.applications.recent.length ? <div className="zwd-list">{read.data.applications.recent.map(item => <Link href={`/worker/applications/${item.id}`} key={item.id}><div><strong>{item.title}</strong><small>{dateLabel(item.updatedAt)}</small></div><Status value={item.stage} /></Link>)}</div> : <WorkerEmpty icon={Search} title="No applications yet" copy="Apply to a published role and its hiring progress will appear here." href="/worker/jobs" label="Find work" />}</section>
      <section className="zw-card zwd-panel"><div className="zwd-panel-head"><div><p className="zw-eyebrow">EARNINGS & PAYMENTS</p><h2>Approved financial history</h2></div><WalletCards aria-hidden="true" /></div><div className="zwd-money"><div><span>Net approved</span><strong>{money(read.data.earnings.approvedPaise)}</strong></div><div><span>Payments recorded</span><strong>{money(read.data.earnings.paidPaise)}</strong></div><div><span>Outstanding</span><strong>{money(read.data.earnings.outstandingPaise)}</strong></div></div><p className="zw-muted">Only operations-approved earnings statements appear here. Payment entries record operational payment history; they do not initiate transfers.</p><Link className="zw-button zw-button--secondary" href="/worker/earnings">Open earnings history<ArrowUpRight aria-hidden="true" /></Link></section>
      <section className="zw-card zwd-panel"><div className="zwd-panel-head"><div><p className="zw-eyebrow">RECENT ACTIVITY</p><h2>What changed</h2></div><CheckCircle2 aria-hidden="true" /></div>{read.data.activity.length ? <ol className="zwd-timeline">{read.data.activity.map(item => <li key={item.id}><span aria-hidden="true" /><div><strong>{item.title}</strong><p>{item.detail}</p><small>{dateLabel(item.at)}</small></div></li>)}</ol> : <p className="zw-info">Your application, attendance, earnings and payment activity will build here from real records.</p>}</section>
    </div>
    <section className="zwd-quick"><WorkerHeading eyebrow="QUICK LINKS" title="Go straight to the work." copy="Open the part of your worker workspace you need without hunting through extra screens." /><div>{quick.map(([href, label, Icon]) => <Link key={href} href={href}><Icon aria-hidden="true" /><span>{label}</span><ArrowUpRight aria-hidden="true" /></Link>)}</div></section>
  </div>}</ReadState>;
}
function Metric({ icon: Icon, label, value, copy }: { icon: typeof FileCheck2; label: string; value: string; copy: string }) { return <article className="zw-card"><span className="zw-icon"><Icon aria-hidden="true" /></span><div><span>{label}</span><strong>{value}</strong><small>{copy}</small></div></article>; }
function NextActions({ data, completion }: { data: WorkerDashboardData; completion: number }) {
  const actions = [] as { href: string; title: string; copy: string; icon: typeof UserRound }[];
  if (completion < 100) actions.push({ href: "/worker/profile", title: "Complete your profile", copy: "A stronger profile gives reviewers the full picture.", icon: UserRound });
  const update = data.applications.recent.find(item => !["SUBMITTED"].includes(item.stage)); if (update) actions.push({ href: `/worker/applications/${update.id}`, title: `Review ${stageLabel(update.stage)} update`, copy: update.title, icon: FileCheck2 });
  if (data.attendance.pending) actions.push({ href: "/worker/attendance", title: `${data.attendance.pending} attendance ${data.attendance.pending === 1 ? "request" : "requests"} in review`, copy: "Track operations decisions and correction outcomes.", icon: CalendarCheck2 });
  if (data.earnings.outstandingPaise > 0) actions.push({ href: "/worker/earnings", title: "Review your outstanding balance", copy: `${money(data.earnings.outstandingPaise)} remains outstanding across approved statements.`, icon: WalletCards });
  if (!actions.length) actions.push({ href: "/worker/jobs", title: "Explore current opportunities", copy: "Your workspace is clear. Browse live roles when you are ready.", icon: Search });
  return <section className="zwd-actions"><p className="zw-eyebrow">NEXT ACTIONS</p><div>{actions.slice(0, 3).map(({ href, title, copy, icon: Icon }) => <Link key={href + title} href={href}><span className="zw-icon"><Icon aria-hidden="true" /></span><span><strong>{title}</strong><small>{copy}</small></span><ArrowUpRight aria-hidden="true" /></Link>)}</div></section>;
}
