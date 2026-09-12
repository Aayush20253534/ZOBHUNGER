/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  Image as ImageIcon,
  Layers3,
  Workflow,
} from "lucide-react";
import {
  ArticleCover,
  ArticleFieldExample,
  ArticleWorkflow,
  articleExampleAnchor,
  articleWorkflowAnchor,
} from "@/components/blog/ArticleVisuals";
import { ActionLink } from "@/components/common/ActionLink";
import { ArticleInlineText } from "@/components/blog/ArticleInlineText";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CTASection } from "@/components/common/CTASection";
import { PageShell } from "@/components/common/PageShell";
import { getPageMetadata } from "@/lib/page-metadata";
import { blogPostingJsonLd, breadcrumbJsonLd, serializeJsonLd } from "@/lib/seo";
import { site } from "@/data/site";
import { getArticleVisualStory } from "@/data/article-visual-stories";
import { executionVisuals } from "@/data/execution-visuals";
import { mockArticles } from "@/mocks/articles";
import { getArticleForPage } from "@/services/articles.service";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return mockArticles
    .filter((article) => article.isPublished)
    .map((article) => ({ slug: article.slug }));
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticleForPage((await params).slug);
  if (!article?.isPublished)
    return {
      title: "Guide not found",
      robots: { index: false, follow: false },
    };
  const metadata = getPageMetadata(
    article.seoTitle || article.title,
    article.seoDescription || article.excerpt,
    `/blog/${encodeURIComponent(article.slug)}`,
  );
  const story = getArticleVisualStory(article.slug);
  const storyCover = story ? executionVisuals[story.cover] : null;
  const imageUrl = article.ogImageUrl || article.coverImageUrl || (storyCover ? `${site.url}${storyCover.src}` : null);
  const canonical = article.canonicalUrl || `${site.url}/blog/${encodeURIComponent(article.slug)}`;
  const image = imageUrl ? [{ url: imageUrl, ...(storyCover && imageUrl.endsWith(storyCover.src) ? { width: storyCover.width, height: storyCover.height, alt: storyCover.alt } : {}) }] : undefined;

  return {
    ...metadata,
    alternates: { canonical },
    authors: article.authorName ? [{ name: article.authorName }] : undefined,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      url: canonical,
      publishedTime: article.publishedAt || undefined,
      modifiedTime: article.updatedAt || undefined,
      authors: article.authorName ? [article.authorName] : undefined,
      ...(image ? { images: image } : {}),
    },
    twitter: {
      ...metadata.twitter,
      card: "summary_large_image",
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticleForPage((await params).slug);
  if (!article?.isPublished) notFound();
  const visualStory = getArticleVisualStory(article.slug);

  const articleImage = article.ogImageUrl || article.coverImageUrl || (visualStory ? `${site.url}${executionVisuals[visualStory.cover].src}` : undefined);
  const schemas = [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blogs" },
      { name: article.title, path: `/blog/${encodeURIComponent(article.slug)}` },
    ]),
    blogPostingJsonLd(article, articleImage),
  ];

  return (
    <>
      {schemas.map((schema) => (
        <script
          key={schema["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blogs" },
          { label: article.category },
        ]}
      />

      <article>
        <div className={`zb-article-heading zb-article-heading--premium${visualStory ? " zb-article-heading--illustrated" : ""}`}>
          <div className="zb-blog-article-intro">
            <div className="zb-blog-heading-copy">
          <PageShell
            eyebrow={article.category}
            title={article.title}
            description={article.excerpt}
          />

          <div className="zb-article-summary-strip" aria-label="Article summary">
            <div>
              <span aria-hidden="true"><BookOpen /></span>
              <small>Format</small>
              <strong>{visualStory ? "Illustrated guide" : "Editorial deep dive"}</strong>
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
          {(article.authorName || article.publishedAt) && (
            <div className="zb-article-author-line">
              {article.authorName && <span>By {article.authorName}</span>}
              {article.publishedAt && <time dateTime={article.publishedAt}>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(article.publishedAt))}</time>}
            </div>
          )}
            </div>
            {visualStory ? <ArticleCover story={visualStory} /> : article.coverImageUrl ? (
              <figure className="zb-cms-article-cover">
                <img src={article.coverImageUrl} alt={article.title} decoding="async" />
              </figure>
            ) : null}
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
                  <p key={index}><ArticleInlineText text={paragraph} /></p>
                ))}

                {section.points?.length ? (
                  <ul>
                    {section.points.map((point, index) => (
                      <li key={`${section.id}-point-${index}`}><ArticleInlineText text={point} /></li>
                    ))}
                  </ul>
                ) : null}

                {section.quotes?.map((quote, index) => (
                  <blockquote className="zb-cms-quote" key={`${section.id}-quote-${index}`}><ArticleInlineText text={quote} /></blockquote>
                ))}

                {section.images?.map((image, index) => (
                  <figure className="zb-cms-content-image" key={`${section.id}-image-${index}`}>
                    <img src={image.url} alt={image.alt} loading="lazy" decoding="async" />
                    {image.caption && <figcaption><ArticleInlineText text={image.caption} /></figcaption>}
                  </figure>
                ))}

                {visualStory?.example.sectionId === section.id && (
                  <ArticleFieldExample example={visualStory.example} />
                )}
                {visualStory?.workflow.sectionId === section.id && (
                  <ArticleWorkflow workflow={visualStory.workflow} />
                )}
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
                    {visualStory?.example.sectionId === section.id && (
                      <a className="zb-blog-toc-visual" href={`#${articleExampleAnchor}`}>
                        <ImageIcon aria-hidden="true" /> Field example
                      </a>
                    )}
                    {visualStory?.workflow.sectionId === section.id && (
                      <a className="zb-blog-toc-visual" href={`#${articleWorkflowAnchor}`}>
                        <Workflow aria-hidden="true" /> Visual workflow
                      </a>
                    )}
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
              <ActionLink
                href={visualStory ? `/hire-workforce?service=${encodeURIComponent(visualStory.service)}` : "/hire-workforce"}
                variant="light"
              >
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
          href={visualStory ? `/${visualStory.service}` : "/solutions"}
          label={visualStory ? `Explore ${visualStory.serviceLabel}` : "Explore our services"}
        />
      </div>

      <ActionLink href="/blogs" variant="text" className="zb-back-to-insights">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to all insights
      </ActionLink>
    </>
  );
}
