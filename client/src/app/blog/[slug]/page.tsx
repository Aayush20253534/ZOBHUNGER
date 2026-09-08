import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  Layers3,
} from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { PageShell } from "@/components/common/PageShell";
import { getPageMetadata } from "@/lib/page-metadata";
import { site } from "@/data/site";
import { mockArticles } from "@/mocks/articles";
import { getArticleForPage } from "@/services/articles.service";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return mockArticles
    .filter((article) => article.isPublished)
    .map((article) => ({ slug: article.slug }));
}


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
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticleForPage((await params).slug);
  if (!article?.isPublished) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    articleSection: article.category,
    mainEntityOfPage: `${site.url}/blog/${encodeURIComponent(article.slug)}`,
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blogs" },
          { label: article.category },
        ]}
      />

      <article>
        <div className="zb-article-heading zb-article-heading--premium">
          <PageShell
            eyebrow={article.category}
            title={article.title}
            description={article.excerpt}
          />

          <div className="zb-article-summary-strip" aria-label="Article summary">
            <div>
              <span aria-hidden="true"><BookOpen /></span>
              <small>Format</small>
              <strong>Editorial deep dive</strong>
            </div>
            <div>
              <span aria-hidden="true"><Clock3 /></span>
              <small>Reading time</small>
              <strong>{article.readingMinutes} min read</strong>
            </div>
            <div>
              <span aria-hidden="true"><Layers3 /></span>
              <small>Sections</small>
              <strong>{article.sections.length} sections</strong>
            </div>
          </div>

        </div>

        <div className="zb-article-layout">
          <div className="zb-article-body">
            <aside className="zb-article-takeaway" aria-label="Key idea">
              <span className="zb-eyebrow">The key idea</span>
              <p>{article.takeaway}</p>
            </aside>

            {article.sections.map((section, sectionIndex) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
              >
                <div className="zb-article-section-heading">
                  <span>{String(sectionIndex + 1).padStart(2, "0")}</span>
                  <h2 id={`${section.id}-title`}>{section.heading}</h2>
                </div>

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
              <span className="zb-eyebrow">Reading path</span>
              <h2>In this guide</h2>
              <ol>
                {article.sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.heading}</a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="zb-article-sidebar-cta">
              <span className="zb-eyebrow">Move from insight to action</span>
              <h2>Have a requirement in mind?</h2>
              <p>
                Bring the roles, locations and timeline into one conversation.
              </p>
              <ActionLink href="/hire-workforce" variant="light">
                Share your brief
              </ActionLink>
            </div>
          </aside>
        </div>
      </article>

      <div className="zb-editorial-section">
        <CTASection
          title="What does the next assignment need?"
          description="Explore the services that can support your team and your business."
          href="/solutions"
          label="Explore our services"
        />
      </div>

      <ActionLink href="/blogs" variant="text" className="zb-back-to-insights">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to all insights
      </ActionLink>
    </>
  );
}
