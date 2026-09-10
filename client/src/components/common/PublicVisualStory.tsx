import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ExecutionImage } from "@/components/common/ExecutionImage";
import { executionVisuals, type ExecutionVisualId } from "@/data/execution-visuals";
import "@/styles/public-visual-story.css";

export interface PublicVisualStoryItem {
  visual: ExecutionVisualId;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}

interface PublicVisualStoryProps {
  eyebrow: string;
  title: string;
  description: string;
  items: readonly PublicVisualStoryItem[];
  className?: string;
}

export function PublicVisualStory({
  eyebrow,
  title,
  description,
  items,
  className = "",
}: PublicVisualStoryProps) {
  return (
    <section className={`zb-public-visual-story ${className}`.trim()} aria-label={title}>
      <header className="zb-public-visual-story__heading">
        <div>
          <span className="zb-eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <p>{description}</p>
      </header>

      <div className="zb-public-visual-story__grid">
        {items.map((item, index) => {
          const visual = executionVisuals[item.visual];
          const body = (
            <>
              <div className="zb-public-visual-story__image">
                <ExecutionImage
                  visual={visual}
                  sizes="(min-width: 1000px) 350px, (min-width: 640px) 50vw, calc(100vw - 48px)"
                />
                <span className="zb-public-visual-story__number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="zb-public-visual-story__label">{visual.title}</span>
              </div>
              <div className="zb-public-visual-story__body">
                <h3>{item.title}</h3>
                <p>{item.description ?? visual.caption}</p>
                {item.href ? (
                  <span className="zb-public-visual-story__link">
                    {item.linkLabel ?? "Explore service"}
                    <ArrowUpRight aria-hidden="true" />
                  </span>
                ) : null}
              </div>
            </>
          );

          return item.href ? (
            <Link className="zb-public-visual-story__card" href={item.href} key={`${item.visual}-${item.title}`}>
              {body}
            </Link>
          ) : (
            <article className="zb-public-visual-story__card" key={`${item.visual}-${item.title}`}>
              {body}
            </article>
          );
        })}
      </div>
    </section>
  );
}
