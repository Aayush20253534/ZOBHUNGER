import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Clock3 } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { PageShell } from "@/components/common/PageShell";
import { getPageMetadata } from "@/lib/page-metadata";
import { getArticleForPage } from "@/services/articles.service";
import { getEditorialDataMode } from "@/services/adapters";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const article = await getArticleForPage((await params).slug);
  if (!article?.isPublished)
    return {
      title: "Guide not found",
      robots: { index: false, follow: false },
    };
  return {
    ...getPageMetadata(
      article.title,
      article.excerpt,
      `/blog/${encodeURIComponent(article.slug)}`,
    ),
    ...(getEditorialDataMode() === "mock" || article.isSample
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticleForPage((await params).slug);
  if (!article?.isPublished) notFound();
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Insights", href: "/blog" },
          { label: article.category },
        ]}
      />
      <article>
        <div className="zb-article-heading">
          <PageShell
            eyebrow={article.category}
            title={article.title}
            description={article.excerpt}
          />
          <div className="zb-article-meta">
            <span>
              <BookOpen aria-hidden="true" />
              {article.isSample ? "Sample guide" : "Practical guide"}
            </span>
            <span>
              <Clock3 aria-hidden="true" />
              {article.readingMinutes} min read
            </span>
          </div>
          {article.isSample && (
            <p className="zb-inline-notice">
              Editorial sample for review; not an approved ZOBHUNGER
              publication.
            </p>
          )}
        </div>
        <div className="zb-article-layout">
          <div className="zb-article-body">
            <aside className="zb-article-takeaway" aria-label="Key idea">
              <span className="zb-eyebrow">The key idea</span>
              <p>{article.takeaway}</p>
            </aside>
            {article.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
              >
                <h2 id={`${section.id}-title`}>{section.heading}</h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
                {section.points?.length ? (
                  <ul>
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
          <aside className="zb-article-sidebar">
            <nav aria-label="In this guide">
              <h2>In this guide</h2>
              <ol>
                {article.sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.heading}</a>
                  </li>
                ))}
              </ol>
            </nav>
            <div>
              <h2>Have a requirement in mind?</h2>
              <p>
                Bring the roles, locations and timeline into one conversation.
              </p>
              <ActionLink href="/hire-workforce">Share your brief</ActionLink>
            </div>
          </aside>
        </div>
      </article>
      <div className="zb-editorial-section">
        <CTASection
          title="What does the next assignment need?"
          description="Explore the services that can support your team and your business."
          href="/solutions"
          label="Explore solutions"
        />
      </div>
      <ActionLink href="/blogs" variant="text" className="zb-back-to-insights">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to all insights
      </ActionLink>
    </>
  );
}
