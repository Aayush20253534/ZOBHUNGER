import { ArrowUpRight, BrainCircuit, Building2, ChartNoAxesCombined, Cpu, FileBarChart2, MapPinned, ScanLine, Store, UsersRound } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { ExecutionImage } from "@/components/common/ExecutionImage";
import { SectionHeading } from "@/components/common/SectionHeading";
import { executionVisuals } from "@/data/execution-visuals";
import { companyScale } from "@/data/service-expansion";
import "@/styles/home-scale.css";

const technology = [
  { label: "AI-Driven Workforce Management", icon: UsersRound },
  { label: "Smart Field Monitoring", icon: ScanLine },
  { label: "Automated Reporting", icon: FileBarChart2 },
  { label: "Data-Driven Business Insights", icon: ChartNoAxesCombined },
];

export function HomeScale() {
  return <section id="our-scale" className="zb-home-section zb-scale" aria-labelledby="home-scale-heading">
    <SectionHeading id="home-scale-heading" eyebrow="People. Presence. Technology." title="Built for the scale of your ambition." action={<ActionLink href="/for-business" variant="text">Explore business solutions<ArrowUpRight aria-hidden="true" /></ActionLink>} />
    <div className="zb-scale-mosaic">
      <dl className="zb-scale-numbers">
        <div className="zb-scale-tile zb-scale-force"><dt><UsersRound aria-hidden="true" />Gig Field Force</dt><dd>{companyScale.fieldForce}</dd><dd className="zb-scale-note">People powering execution on the ground.</dd></div>
        <div className="zb-scale-tile zb-scale-clients"><dt><Building2 aria-hidden="true" />Clients across industries</dt><dd>{companyScale.clients}</dd><dd className="zb-scale-note">{companyScale.sectors}</dd></div>
        <div className="zb-scale-tile zb-scale-coverage"><dt><MapPinned aria-hidden="true" />Deployment PIN Codes</dt><dd>{companyScale.pinCodes}</dd><dd className="zb-scale-note">Covered across India</dd></div>
        <div className="zb-scale-tile zb-scale-offices"><dt><Building2 aria-hidden="true" />Regional Offices</dt><dd>{companyScale.offices}</dd><dd className="zb-scale-note"><ActionLink href="/presence" variant="text">Explore our presence<ArrowUpRight aria-hidden="true" /></ActionLink></dd></div>
      </dl>
      <div className="zb-scale-markets">
        <figure><ExecutionImage visual={executionVisuals.audit} sizes="(min-width: 1100px) 260px, (min-width: 600px) 42vw, 80vw" /><figcaption><Store aria-hidden="true" /><div><span>Modern trade</span><p>Organised retail. Consistent execution.</p></div></figcaption></figure>
        <figure><ExecutionImage visual={executionVisuals["qr-deployment"]} sizes="(min-width: 1100px) 260px, (min-width: 600px) 42vw, 80vw" /><figcaption><MapPinned aria-hidden="true" /><div><span>General trade</span><p>Local markets. Personal connections.</p></div></figcaption></figure>
        <small>Illustrative AI-generated field scenes</small>
      </div>
    </div>
    <div className="zb-scale-technology">
      <div className="zb-scale-platform"><span className="zb-scale-tech-icon"><Cpu aria-hidden="true" /></span><div><h3><strong>{companyScale.platform}</strong> In-House Technology Platform</h3><p>Powered by AI, Image Recognition, Real-Time Analytics &amp; Advanced Business Intelligence (BI) Tools.</p></div></div>
      <div className="zb-scale-capabilities"><span className="zb-scale-capability-heading"><BrainCircuit aria-hidden="true" />Technology that connects the work</span><ul>{technology.map(({label,icon: Icon}) => <li key={label}><Icon aria-hidden="true" />{label}</li>)}</ul></div>
    </div>
  </section>;
}
