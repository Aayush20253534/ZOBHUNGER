import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Route,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { ActionButton } from "@/components/common/ActionButton";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
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
import { getEditorialDataMode } from "@/services/adapters";

const editorialLanes = [
  {
    icon: UsersRound,
    title: "People & hiring",
    description: "Clearer briefs, workforce planning and team decisions.",
  },
  {
    icon: Route,
    title: "Field execution",
    description: "Practical thinking for retail, gig and on-ground work.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Business operations",
    description: "Ideas that connect people, process and delivery.",
  },
] as const;

export function generateMetadata() {
  return {
    ...getPageMetadata(
      "Blog",
      "Practical guides to hiring, workforce management, sales and business execution.",
      "/blogs",
    ),
    ...(getEditorialDataMode() === "mock"
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
  const isPreview =
    getEditorialDataMode() === "mock" || list.items.some((article) => article.isSample);

  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />

      <div className="zb-editorial-hero zb-editorial-hero--premium">
        <PageShell
          eyebrow="Blog"
          title="Useful thinking for people, markets and execution."
          description="Practical perspectives on hiring, workforce coordination, field execution and the operating decisions behind better delivery."
          actions={
            <ActionLink href="#insights-search" variant="secondary">
              Explore insights
            </ActionLink>
          }
        >
          {isPreview && (
            <p className="zb-inline-notice">
              Seeded editorial samples for review. They are loaded from the
              database in API mode, but are not approved company publications.
            </p>
          )}
        </PageShell>

        <aside
          className="zb-premium-hero-card zb-insights-hero-card zb-insights-editorial-map"
          aria-labelledby="insights-intro-title"
        >
          <div className="zb-premium-card-header">
            <span className="zb-premium-card-icon" aria-hidden="true">
              <BookOpen />
            </span>
            <div>
              <span className="zb-eyebrow">Editorial desk</span>
              <h2 id="insights-intro-title">
                Practical ideas organised around the work businesses actually do.
              </h2>
            </div>
          </div>

          <div className="zb-insights-lane-grid">
            {editorialLanes.map((lane, index) => {
              const Icon = lane.icon;
              return (
                <article key={lane.title}>
                  <span className="zb-insights-lane-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <div>
                    <small>{String(index + 1).padStart(2, "0")}</small>
                    <strong>{lane.title}</strong>
                    <p>{lane.description}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="zb-insights-feature-strip">
            <Sparkles aria-hidden="true" />
            <p>
              <strong>Useful over ornamental.</strong> Clear guidance for real
              operating choices, without consulting-deck fog.
            </p>
          </div>

          <ActionLink href="#insights-search" variant="text">
            Search all insights
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </ActionLink>
        </aside>
      </div>

      <section
        className="zb-insights-controls"
        id="insights-search"
        aria-label="Search and filter insights"
      >
        <div className="zb-insights-controls-heading">
          <div>
            <span className="zb-eyebrow">Insight library</span>
            <h2>Find the topic that matches the work ahead.</h2>
          </div>
          <span className="zb-insights-guide-count">
            {list.total} {list.total === 1 ? "guide" : "guides"}
          </span>
        </div>

        <form action="/blogs" method="get" className="zb-insights-search">
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
            <ActionLink href="/blogs" variant="text">
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
          title="Turn the reading into an execution brief."
          description="Bring your roles, locations and the work you want to get done into one conversation."
        />
      </div>
    </>
  );
}
