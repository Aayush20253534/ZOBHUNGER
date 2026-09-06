import { BriefcaseBusiness, Check, UsersRound } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Card } from "@/components/ui/card";
import { home } from "@/data/home";

export function AudienceSection() {
  return (
    <section
      className="zb-home-audiences zb-home-section"
      aria-label="For businesses and workers"
    >
      <Card className="zb-home-audience-card" data-audience="business">
        <div className="zb-home-audience-label">
          <BriefcaseBusiness aria-hidden="true" />
          <span>For businesses</span>
        </div>
        <h2>{home.audiences.business.title}</h2>
        <p>{home.audiences.business.description}</p>
        <ul>
          {home.audiences.business.points.map((point) => (
            <li key={point}>
              <Check aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
        <div className="zb-home-audience-actions">
          <ActionLink href="/hire-workforce">Share your requirement</ActionLink>
          <ActionLink href="/for-business" variant="text">
            For your business
          </ActionLink>
        </div>
      </Card>
      <Card className="zb-home-audience-card" data-audience="worker">
        <div className="zb-home-audience-label">
          <UsersRound aria-hidden="true" />
          <span>For workers</span>
        </div>
        <h2>{home.audiences.worker.title}</h2>
        <p>{home.audiences.worker.description}</p>
        <ul>
          {home.audiences.worker.points.map((point) => (
            <li key={point}>
              <Check aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
        <div className="zb-home-audience-actions">
          <ActionLink href="/jobs">Explore jobs</ActionLink>
          <ActionLink href="/for-workers" variant="text">
            Working with ZOBHUNGER
          </ActionLink>
        </div>
      </Card>
    </section>
  );
}
