import { BadgeCheck, ClipboardCheck, FileUser, Handshake, KeyRound, UsersRound } from "lucide-react";
import "@/styles/intake.css";

export function ApplicationJourney({ kind }: { kind: "partner" | "career" }) {
  const steps = kind === "partner" ? [
    { title: "Tell us about your business", detail: "Submit your partnership application.", icon: Handshake },
    { title: "Company review & approval", detail: "Our team evaluates your application.", icon: ClipboardCheck },
    { title: "Partner ID & first login", detail: "Receive access and set your own password.", icon: KeyRound },
  ] : [
    { title: "Submit your profile & CV", detail: "Share the required education, experience, skills and work preferences.", icon: FileUser },
    { title: "Review & verification", detail: "Our team checks the submitted details and profile fit.", icon: ClipboardCheck },
    { title: "Approval & communication", detail: "Approved candidates are contacted when a suitable project requirement is available.", icon: UsersRound },
  ];
  return <div className="zb-intake-journey">
    <p><BadgeCheck aria-hidden="true" />{kind === "partner" ? "Business access starts with approval" : "Worker onboarding starts with profile review"}</p>
    <ol>{steps.map(({ title, detail, icon: Icon }, index) => <li key={title}>
      <span className="zb-intake-journey-icon" aria-hidden="true"><Icon /></span>
      <div><small>0{index + 1}</small><h3>{title}</h3><p>{detail}</p></div>
    </li>)}</ol>
  </div>;
}
