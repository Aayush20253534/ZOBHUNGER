import Link from "next/link";
import { ArrowUpRight, BookOpen, Clock3 } from "lucide-react";
import type { ArticleSummary } from "@/types/article.types";

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <article className="zb-article-card">
      <div className="zb-article-card-top">
        <span className="zb-icon-tile">
          <BookOpen aria-hidden="true" />
        </span>
        <span className="zb-chip">
          {article.isSample ? "Sample guide" : "Insight"}
        </span>
      </div>
      <p className="zb-eyebrow">{article.category}</p>
      <h3>
        <Link href={`/blog/${encodeURIComponent(article.slug)}`}>
          {article.title}
        </Link>
      </h3>
      <p className="zb-article-excerpt">{article.excerpt}</p>
      <div className="zb-article-card-footer">
        <span>
          <Clock3 aria-hidden="true" />
          {article.readingMinutes} min read
        </span>
        <span className="zb-article-read" aria-hidden="true">
          Read guide
          <ArrowUpRight />
        </span>
      </div>
    </article>
  );
}
