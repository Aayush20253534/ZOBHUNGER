import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ExecutionImage } from "@/components/common/ExecutionImage";
import { getArticleVisualStory } from "@/data/article-visual-stories";
import { executionVisuals } from "@/data/execution-visuals";
import type { ArticleSummary } from "@/types/article.types";
import "@/styles/blog-storytelling.css";

export function BlogFeaturedStory({
  article,
  label,
}: {
  article: ArticleSummary;
  label: string;
}) {
  const story = getArticleVisualStory(article.slug);
  if (!story) return null;

  return (
    <aside className="zb-blog-feature" aria-labelledby="blog-feature-title">
      <Link href={`/blog/${encodeURIComponent(article.slug)}`} aria-label={`Read ${article.title}`}>
        <ExecutionImage
          visual={executionVisuals[story.cover]}
          sizes="(min-width: 1100px) 416px, (min-width: 960px) 36vw, (min-width: 480px) 416px, calc(100vw - 40px)"
          priority
        />
        <div className="zb-blog-feature-copy">
          <div className="zb-blog-feature-meta">
            <span>{label}</span>
            <span>{article.readingMinutes} min read</span>
          </div>
          <h2 id="blog-feature-title">{article.title}</h2>
          <span className="zb-blog-feature-read" aria-hidden="true">
            Read the guide <ArrowUpRight />
          </span>
        </div>
      </Link>
    </aside>
  );
}
