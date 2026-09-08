import { ActionLink } from "@/components/common/ActionLink";
import { EmptyState } from "@/components/common/EmptyState";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { articlesHref } from "@/lib/article-filters";
import type { ArticleFilters, ArticleList } from "@/types/article.types";

export function ArticleResults({
  list,
  filters,
}: {
  list: ArticleList;
  filters: ArticleFilters;
}) {
  const first = (list.page - 1) * list.pageSize + 1;
  return (
    <section
      id="insights-results"
      className="zb-insights-results"
      aria-labelledby="insights-results-title"
    >
      <div className="zb-results-heading">
        <h2 id="insights-results-title">
          {filters.category || "Explore the insights"}
        </h2>
        <p role="status">
          {list.total
            ? `${first}–${first + list.items.length - 1} of ${list.total} articles`
            : "No matching articles"}
        </p>
      </div>
      {list.items.length ? (
        <div className="zb-article-grid">
          {list.items.map((article, index) => (
            <ArticleCard
              key={article.slug}
              article={article}
              index={first + index}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No articles match your search"
          description="Try another keyword or choose a different topic."
          action={
            <ActionLink href="/blogs" variant="secondary">
              Clear filters
            </ActionLink>
          }
        />
      )}
      {list.totalPages > 1 && (
        <nav
          className="zb-editorial-pagination"
          aria-label="Insight result pages"
        >
          {list.page > 1 ? (
            <ActionLink
              variant="secondary"
              rel="prev"
              href={`${articlesHref({ ...filters, page: list.page - 1 })}#insights-results`}
            >
              Previous
            </ActionLink>
          ) : (
            <span className="zb-page-unavailable" aria-disabled="true">
              Previous
            </span>
          )}
          <span>
            Page {list.page} of {list.totalPages}
          </span>
          {list.page < list.totalPages ? (
            <ActionLink
              variant="secondary"
              rel="next"
              href={`${articlesHref({ ...filters, page: list.page + 1 })}#insights-results`}
            >
              Next
            </ActionLink>
          ) : (
            <span className="zb-page-unavailable" aria-disabled="true">
              Next
            </span>
          )}
        </nav>
      )}
    </section>
  );
}
