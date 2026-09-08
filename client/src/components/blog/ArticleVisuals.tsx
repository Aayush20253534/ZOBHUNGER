import { ArrowRight, ClipboardList, FileCheck2, MapPinned, RotateCcw, UsersRound } from "lucide-react";
import { ExecutionImage } from "@/components/common/ExecutionImage";
import { executionVisuals } from "@/data/execution-visuals";
import type { ArticleVisualStory } from "@/data/article-visual-stories";
import "@/styles/blog-storytelling.css";

export const articleExampleAnchor = "article-field-example";
export const articleWorkflowAnchor = "article-visual-workflow";

export function ArticleCover({ story }: { story: ArticleVisualStory }) {
  return (
    <figure className="zb-blog-cover">
      <ExecutionImage
        visual={executionVisuals[story.cover]}
        sizes="(min-width: 1280px) 500px, (min-width: 960px) 40vw, calc(100vw - 80px)"
        priority
      />
      <figcaption>{story.coverCaption}</figcaption>
    </figure>
  );
}

export function ArticleFieldExample({ example }: { example: ArticleVisualStory["example"] }) {
  const entries = [
    { label: "The brief", text: example.brief },
    { label: "On the ground", text: example.action },
    { label: "Back in review", text: example.review },
  ];

  return (
    <aside
      id={articleExampleAnchor}
      className="zb-blog-field-example"
      aria-labelledby={`${articleExampleAnchor}-title`}
    >
      <div className="zb-blog-example-layout">
        <figure>
          <ExecutionImage
            visual={executionVisuals[example.visual]}
            sizes="(min-width: 1280px) 340px, (min-width: 1000px) 28vw, (min-width: 700px) 40vw, calc(100vw - 120px)"
          />
          <figcaption>{executionVisuals[example.visual].title}</figcaption>
        </figure>
        <header>
          <span className="zb-eyebrow">Illustrative field example</span>
          <h3 id={`${articleExampleAnchor}-title`}>{example.title}</h3>
          <p>{example.situation}</p>
        </header>
      </div>
      <dl className="zb-blog-example-record">
        {entries.map((entry, index) => (
          <div key={entry.label}>
            <dt>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              {entry.label}
            </dt>
            <dd>{entry.text}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

const workflowIcons = [ClipboardList, MapPinned, FileCheck2, UsersRound];

export function ArticleWorkflow({ workflow }: { workflow: ArticleVisualStory["workflow"] }) {
  return (
    <figure
      id={articleWorkflowAnchor}
      className="zb-blog-workflow"
      aria-labelledby={`${articleWorkflowAnchor}-title`}
    >
      <figcaption>
        <span className="zb-eyebrow">The workflow at a glance</span>
        <h3 id={`${articleWorkflowAnchor}-title`}>{workflow.title}</h3>
      </figcaption>
      <ol className="zb-blog-workflow-track" aria-label="Execution sequence">
        {workflow.steps.map((step, index) => {
          const Icon = workflowIcons[index];

          return (
            <li key={step.title}>
              <div className="zb-blog-workflow-marker" aria-hidden="true">
                <Icon />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div>
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
              {index < workflow.steps.length - 1 && (
                <ArrowRight className="zb-blog-workflow-arrow" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
      <div className="zb-blog-workflow-feedback">
        <RotateCcw aria-hidden="true" />
        <div>
          <strong>Close the loop</strong>
          <p>{workflow.feedback}</p>
        </div>
      </div>
    </figure>
  );
}
