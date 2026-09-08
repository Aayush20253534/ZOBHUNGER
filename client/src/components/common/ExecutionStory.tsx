import { ArrowDown, ClipboardList, FileCheck2, Send } from "lucide-react";
import { ExecutionImage } from "@/components/common/ExecutionImage";
import { executionVisuals } from "@/data/execution-visuals";
import type { ExecutionStoryContent } from "@/data/execution-storytelling";
import "@/styles/execution-storytelling.css";

export function ExecutionStory({
  id,
  label,
  story,
}: {
  id: string;
  label: string;
  story: ExecutionStoryContent;
}) {
  return (
    <article className="zb-execution-story" aria-labelledby={`${id}-title`}>
      {"visualId" in story ? (
        <figure className="zb-execution-story-scene">
          <ExecutionImage
            visual={executionVisuals[story.visualId]}
            sizes="(min-width: 1280px) 560px, (min-width: 960px) 44vw, calc(100vw - 64px)"
          />
          <figcaption>{executionVisuals[story.visualId].caption}</figcaption>
        </figure>
      ) : (
        <div className="zb-execution-work-record">
          <div className="zb-execution-record-heading">
            <ClipboardList aria-hidden="true" />
            <div>
              <span>Example work record</span>
              <strong>{story.record.title}</strong>
            </div>
          </div>
          <dl>
            {story.record.fields.map((field) => (
              <div key={field.label}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
          <ArrowDown className="zb-execution-record-arrow" aria-hidden="true" />
          <p className="zb-execution-record-handoff">
            <Send aria-hidden="true" />
            {story.record.handoff}
          </p>
        </div>
      )}

      <div className="zb-execution-story-copy">
        <header>
          <span className="zb-eyebrow">{label}</span>
          <h3 id={`${id}-title`}>{story.title}</h3>
          <p>{story.description}</p>
        </header>
        <ol className="zb-execution-story-actions" aria-label="What the team does">
          {story.actions.map((action, index) => (
            <li key={action.title}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h4>{action.title}</h4>
                <p>{action.description}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="zb-execution-story-outcome">
          <FileCheck2 aria-hidden="true" />
          <div>
            <h4>What you can review</h4>
            <p>{story.outcome}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
