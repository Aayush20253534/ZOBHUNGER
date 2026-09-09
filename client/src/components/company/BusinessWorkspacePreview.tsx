import { ArrowDownToLine, ArrowUpRight, Building2, CalendarCheck2, ClipboardList, Files, MapPin, UsersRound } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";

const workspaceSteps = [
  { title: "Requirements", description: "Save & submit briefs.", icon: ClipboardList },
  { title: "Candidates", description: "Profiles & decisions.", icon: UsersRound },
  { title: "Deployment", description: "Teams & schedules.", icon: MapPin },
  { title: "Attendance", description: "Records & approvals.", icon: CalendarCheck2 },
] as const;

/** Public feature illustration; no private records or invented activity totals. */
export function BusinessWorkspacePreview() {
  return (
    <aside className="zb-business-preview" aria-labelledby="business-workspace-title">
      <div className="zb-business-preview-top">
        <span className="zb-business-access-icon" aria-hidden="true"><Building2 /></span>
        <div><span className="zb-eyebrow">Your business workspace</span><h2 id="business-workspace-title">Every step, in one place.</h2></div>
      </div>
      <ol className="zb-business-preview-journey" aria-label="What you can manage in the business portal">
        {workspaceSteps.map(({ title, description, icon: Icon }, index) => (
          <li key={title}>
            <span className="zb-business-step-icon" aria-hidden="true"><Icon /></span>
            <div><span className="zb-business-step-number" aria-hidden="true">0{index + 1}</span><h3>{title}</h3><p>{description}</p></div>
          </li>
        ))}
      </ol>
      <div className="zb-business-preview-report">
        <Files aria-hidden="true" /><div><strong>Reports that bring it together</strong><span>Filter, export CSV or print your records.</span></div><ArrowDownToLine aria-hidden="true" />
      </div>
      <ActionLink href="#business-get-started" variant="text">See how to get started<ArrowUpRight aria-hidden="true" /></ActionLink>
    </aside>
  );
}
