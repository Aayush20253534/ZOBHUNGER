import { BadgeCheck, ClipboardCheck, FileUser, Handshake, KeyRound, Upload, UsersRound } from "lucide-react";
import "@/styles/intake.css";

export function ApplicationJourney({ kind }: { kind: "partner" | "career" }) {
  const steps = kind === "partner" ? [
    { title: "Tell us about your business", detail: "Submit your partnership application.", icon: Handshake },
    { title: "Company review & approval", detail: "Our team evaluates your application.", icon: ClipboardCheck },
    { title: "Partner ID & first login", detail: "Receive access and set your own password.", icon: KeyRound },
  ] : [
    { title: "Build your profile", detail: "Your education, experience and skills.", icon: FileUser },
    { title: "Attach your resume", detail: "Upload your CV as a PDF.", icon: Upload },
    { title: "Connect with our HR team", detail: "We review profiles and contact shortlisted candidates.", icon: UsersRound },
  ];
  return <div className="zb-intake-journey">
    <p><BadgeCheck aria-hidden="true" />{kind === "partner" ? "Business access starts with approval" : "A profile our team can get to know"}</p>
    <ol>{steps.map(({ title, detail, icon: Icon }, index) => <li key={title}>
      <span className="zb-intake-journey-icon" aria-hidden="true"><Icon /></span>
      <div><small>0{index + 1}</small><h3>{title}</h3><p>{detail}</p></div>
    </li>)}</ol>
  </div>;
}
