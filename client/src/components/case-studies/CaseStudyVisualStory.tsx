import {
  ArrowRight, Camera, ClipboardCheck, FileCheck2, Gift, MapPinned,
  MessagesSquare, PhoneCall, QrCode, RotateCcw, ShoppingBag, Truck, UserRoundCheck,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import type { CaseStageIcon, CaseStudyVisualStory as VisualStory } from "@/data/case-study-visuals";
import "@/styles/case-study-storytelling.css";

const stageIcons = {
  map: MapPinned,
  conversation: MessagesSquare,
  checklist: ClipboardCheck,
  qr: QrCode,
  shop: ShoppingBag,
  person: UserRoundCheck,
  delivery: Truck,
  camera: Camera,
  sample: Gift,
  record: FileCheck2,
  phone: PhoneCall,
} satisfies Record<CaseStageIcon, typeof MapPinned>;

export function CaseStudyWorkflow({ story }: { story: VisualStory }) {
  return (
    <section id="case-execution" className="zb-case-visual-workflow" aria-labelledby="case-execution-title">
      <div className="zb-case-visual-heading">
        <span className="zb-eyebrow">From brief to field</span>
        <h2 id="case-execution-title">How the work unfolds.</h2>
        <p>{story.introduction}</p>
      </div>
      <ol className="zb-case-workflow-steps">
        {story.stages.map((step, index) => {
          const Icon = stageIcons[step.icon];
          return (
            <li key={step.title}>
              <div className="zb-case-workflow-mark">
                <Icon aria-hidden="true" />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.action}</p>
              <div className="zb-case-step-record"><span>What moves forward</span><strong>{step.record}</strong></div>
              {index < story.stages.length - 1 && <ArrowRight className="zb-case-step-arrow" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function CaseStudyHandover({ story }: { story: VisualStory }) {
  return (
    <section id="case-client-view" className="zb-case-client-view" aria-labelledby="case-client-view-title">
      <div className="zb-case-visual-heading">
        <span className="zb-eyebrow">What the client can review</span>
        <h2 id="case-client-view-title">{story.handoverTitle}</h2>
        <p>Agree these reporting items with the project brief, so the activity leads to a useful client update.</p>
        <div className="zb-case-review-loop"><RotateCcw aria-hidden="true" /><p>{story.feedback}</p></div>
      </div>
      <div className="zb-case-handover-sheet">
        <div className="zb-case-handover-heading"><FileCheck2 aria-hidden="true" /><strong>Suggested client handover</strong></div>
        <dl>
          {story.handover.map((item, index) => (
            <div key={item.title}>
              <dt><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{item.title}</dt>
              <dd>{item.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function CaseStudyRelatedLinks({ story }: { story: VisualStory }) {
  return (
    <nav className="zb-case-related-reading" aria-label="Related service and field guide">
      <ActionLink href={`/${story.service}`} variant="secondary">Explore {story.serviceLabel}<ArrowRight aria-hidden="true" /></ActionLink>
      <ActionLink href={`/blog/${story.articleSlug}`} variant="text">Read the field guide<ArrowRight aria-hidden="true" /></ActionLink>
    </nav>
  );
}
