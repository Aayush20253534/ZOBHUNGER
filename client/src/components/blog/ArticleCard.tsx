import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Clock3,
  Layers3,
  Route,
  Target,
  UsersRound,
  Workflow
} from "lucide-react";
import { ExecutionImage } from "@/components/common/ExecutionImage";
import { getArticleVisualStory } from "@/data/article-visual-stories";
import { executionVisuals } from "@/data/execution-visuals";
import type { ArticleCategory, ArticleSummary } from "@/types/article.types";
import "@/styles/blog-storytelling.css";

const categoryIcons: Record<ArticleCategory, typeof BookOpen> = {
  "Hiring Trends": UsersRound,
  "Workforce Management": Workflow,
  "Sales Hiring": BriefcaseBusiness,
  "Gig Economy": Route,
  "Retail Execution": Layers3,
  "Trade Marketing": Target,
  "Industry Insights": BookOpen,
};

export function ArticleCard({
  article,
  index,
}: {
  article: ArticleSummary;
  index?: number;
}) {
  const CategoryIcon = categoryIcons[article.category] ?? BookOpen;
  const visualStory = getArticleVisualStory(article.slug);

  return (
    <article className="zb-article-card">
      <Link
        href={`/blog/${encodeURIComponent(article.slug)}`}
        prefetch
        className="zb-article-card-link"
        aria-label={`Read ${article.title}`}
      >
        {visualStory ? (
          <div className="zb-article-card-visual zb-blog-card-cover">
            <ExecutionImage
              visual={executionVisuals[visualStory.cover]}
              sizes="(min-width: 1280px) 390px, (min-width: 1000px) 30vw, (min-width: 640px) 45vw, calc(100vw - 40px)"
            />
          </div>
        ) : (
          <div className="zb-article-card-visual" aria-hidden="true">
            <span className="zb-article-card-icon">
              <CategoryIcon />
            </span>
            <span className="zb-article-card-index">
              {String(index ?? 1).padStart(2, "0")}
            </span>
            <span className="zb-article-card-line" />
          </div>
        )}

        <div className="zb-article-card-top">
        <p className="zb-eyebrow">{article.category}</p>
        <span className="zb-chip">
          {visualStory ? "Visual guide" : "Deep dive"}
        </span>
      </div>

        <h3>{article.title}</h3>

        <p className="zb-article-excerpt">{article.excerpt}</p>

        <div className="zb-article-card-footer">
        <span>
          <Clock3 aria-hidden="true" />
          {article.readingMinutes} min read
        </span>
        <span className="zb-article-read" aria-hidden="true">
          Read insight
          <ArrowUpRight />
        </span>
      </div>
      </Link>
    </article>
  );
}
