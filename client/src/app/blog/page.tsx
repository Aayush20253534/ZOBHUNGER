import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { ActionButton } from "@/components/common/ActionButton";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { IntroPanel } from "@/components/common/IntroPanel";
import { PageShell } from "@/components/common/PageShell";
import { ArticleResults } from "@/components/blog/ArticleResults";
import { Input } from "@/components/ui/input";
import { articleCategories } from "@/types/article.types";
import {
  articlesHref,
  parseArticleFilters,
  type ArticleSearchParams,
} from "@/lib/article-filters";
import { getPageMetadata } from "@/lib/page-metadata";
import { getArticles } from "@/services/articles.service";
import { getDataMode } from "@/services/adapters";

export function generateMetadata() {
  return {
    ...getPageMetadata(
      "Blog & Insights",
      "Practical guides to hiring, workforce management, sales and business execution.",
      "/blog",
    ),
    ...(getDataMode() === "mock"
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<ArticleSearchParams>;
}) {
  const filters = parseArticleFilters(await searchParams);
  const list = await getArticles(filters);
  const isPreview = getDataMode() === "mock";
  return (
    <>
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Blog & Insights" }]}
      />
      <div className="zb-editorial-hero">
        <PageShell
          eyebrow="Blog & insights"
          title="Ideas for the work ahead."
          description="Practical perspectives on building teams, planning assignments and connecting people with execution."
          actions={
            <ActionLink href="#insights-search" variant="secondary">
              Explore the guides
            </ActionLink>
          }
        >
          {isPreview && (
            <p className="zb-inline-notice">
              Editorial samples for review. These are not approved company
              publications.
            </p>
          )}
        </PageShell>
        <IntroPanel
          id="insights-intro-title"
          icon={<BookOpen />}
          eyebrow="From planning to delivery"
          title="Bring a clearer plan to your next conversation."
          items={[
            {
              label: "Build the team",
              value: "Hiring briefs, roles and workforce planning",
            },
            {
              label: "Organise the work",
              value: "Assignments, coordination and work updates",
            },
            {
              label: "Support execution",
              value: "Retail, campaigns and industry context",
            },
          ]}
        />
      </div>
      <section
        className="zb-insights-controls"
        id="insights-search"
        aria-label="Search and filter insights"
      >
        <form action="/blog" method="get" className="zb-insights-search">
          <div className="zb-field">
            <label htmlFor="insight-query">Search insights</label>
            <Input
              id="insight-query"
              name="query"
              type="search"
              maxLength={120}
              defaultValue={filters.query}
              key={filters.query}
              placeholder="Try hiring, sales or retail"
              className="zb-input"
            />
          </div>
          {filters.category && (
            <input type="hidden" name="category" value={filters.category} />
          )}
          <ActionButton type="submit">
            <Search aria-hidden="true" className="size-4" />
            Search
          </ActionButton>
          {(filters.query || filters.category) && (
            <ActionLink href="/blog" variant="text">
              Clear filters
            </ActionLink>
          )}
        </form>
        <nav className="zb-topic-filters" aria-label="Insight topics">
          <Link
            href={articlesHref({ query: filters.query }) + "#insights-search"}
            aria-current={!filters.category ? "page" : undefined}
          >
            All topics
          </Link>
          {articleCategories.map((category) => (
            <Link
              key={category}
              href={
                articlesHref({ query: filters.query, category }) +
                "#insights-search"
              }
              aria-current={filters.category === category ? "page" : undefined}
            >
              {category}
            </Link>
          ))}
        </nav>
      </section>
      <ArticleResults list={list} filters={filters} />
      <div className="zb-editorial-section">
        <CTASection
          title="Turn the reading into a requirement."
          description="Bring your roles, locations and the work you want to get done into one brief."
        />
      </div>
    </>
  );
}
