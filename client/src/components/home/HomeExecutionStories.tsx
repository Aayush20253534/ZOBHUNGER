import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  PackageOpen,
  ShieldCheck,
  Megaphone,
  QrCode,
  Store,
} from "lucide-react";
import { HomeServiceOfferings } from "./HomeServiceOfferings";
import { ActionLink } from "@/components/common/ActionLink";
import { ExecutionImage } from "@/components/common/ExecutionImage";
import { SectionHeading } from "@/components/common/SectionHeading";
import { executionVisuals, type ExecutionVisualId } from "@/data/execution-visuals";
import { homeExecutionStories } from "@/data/home-execution-stories";
import "@/styles/home-execution-stories.css";

const storyIcons: Partial<Record<ExecutionVisualId, typeof ClipboardList>> = {
  verification: ShieldCheck,
  "brand-deployment": Megaphone,
  survey: ClipboardList,
  audit: ClipboardCheck,
  "seller-onboarding": Store,
  "qr-deployment": QrCode,
  sampling: PackageOpen,
  "field-executives": BriefcaseBusiness,
};

export function HomeExecutionStories() {
  return (
    <section
      id="home-solutions"
      className="zb-home-section zb-home-stories"
      aria-labelledby="home-execution-stories-heading"
    >
      <SectionHeading
        id="home-execution-stories-heading"
        eyebrow="On the ground"
        title="See Our Team in Action"
        description="See how our team verifies information, builds brand visibility, surveys markets and supports customers—from the first conversation to a clear execution update."
        action={
          <ActionLink href="/hire-workforce" variant="text">
            Discuss your project <ArrowUpRight aria-hidden="true" />
          </ActionLink>
        }
      />

      <div className="zb-home-stories-selector">
        {/* Native radios support pointer, touch and keyboard selection without
            client-side state. CSS progressively enhances the complete stories. */}
        <fieldset className="zb-home-stories-choices">
          <legend className="sr-only">Choose an execution activity</legend>
          {homeExecutionStories.map((story, index) => {
            const Icon = storyIcons[story.id] ?? BriefcaseBusiness;
            return (
              <label className="zb-home-story-choice" key={story.id}>
                <input
                  type="radio"
                  name="home-execution-activity"
                  id={`home-story-${story.id}`}
                  value={story.id}
                  defaultChecked={index === 0}
                  aria-controls={`home-story-panel-${story.id}`}
                />
                <Icon aria-hidden="true" />
                <span>{story.label}</span>
              </label>
            );
          })}
        </fieldset>

        <div className="zb-home-stories-panels">
          {homeExecutionStories.map((story, index) => {
            const visual = executionVisuals[story.id];
            return (
              <article
                className="zb-home-story-panel"
                id={`home-story-panel-${story.id}`}
                aria-labelledby={`home-story-title-${story.id}`}
                key={story.id}
              >
                <div className="zb-home-story-media">
                  <ExecutionImage
                    visual={visual}
                    sizes="(min-width: 1400px) 640px, (min-width: 960px) 50vw, calc(100vw - 64px)"
                  />
                  <div className="zb-home-story-visibility">
                    <FileCheck2 aria-hidden="true" />
                    <div>
                      <strong>What you can review</strong>
                      <p>{story.visibility}</p>
                    </div>
                  </div>
                </div>

                <div className="zb-home-story-copy">
                  <div className="zb-home-story-kicker">
                    <span>{visual.title}</span>
                    <span aria-hidden="true">
                      {String(index + 1).padStart(2, "0")} / {String(homeExecutionStories.length).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 id={`home-story-title-${story.id}`}>{story.heading}</h3>
                  <p className="zb-home-story-description">{visual.caption}</p>

                  <ol
                    className="zb-home-story-steps"
                    aria-label={`${visual.title}: execution steps`}
                  >
                    {visual.steps.map((step, stepIndex) => (
                      <li key={step}>
                        <span className="zb-home-story-step-number" aria-hidden="true">
                          {String(stepIndex + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h4>{step}</h4>
                          <p>{story.stepDetails[stepIndex]}</p>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <div className="zb-home-story-actions">
                    <ActionLink href={`/${story.serviceSlug}`}>
                      Explore service <ArrowUpRight aria-hidden="true" />
                    </ActionLink>
                    <Link
                      className="zb-home-story-case-link"
                      href={story.caseStudySlug ? `/case-studies/${story.caseStudySlug}` : "/case-studies"}
                    >
                      {story.caseStudySlug ? "View case study" : "Browse case studies"}
                      <ArrowUpRight aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <HomeServiceOfferings />
    </section>
  );
}
