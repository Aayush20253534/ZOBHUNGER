"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  ExternalLink,
  FilePenLine,
  FileText,
  Image as ImageIcon,
  Link2,
  List,
  LoaderCircle,
  Plus,
  Quote,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Sparkles,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  archiveAdminArticle,
  createAdminArticle,
  getAdminArticle,
  listAdminArticles,
  publishAdminArticle,
  restoreAdminArticle,
  unpublishAdminArticle,
  updateAdminArticle,
  type AdminArticle,
  type AdminArticleDraftInput,
  type AdminArticlePage,
  type AdminArticleStatus,
} from "@/services/admin-articles.service";
import { articleCategories, type ArticleCategory, type ArticleImage, type ArticleSection } from "@/types/article.types";
import "@/styles/admin-blog-cms.css";

interface EditorState {
  title: string;
  slug: string;
  excerpt: string;
  category: ArticleCategory;
  takeaway: string;
  sections: ArticleSection[];
  authorName: string;
  tags: string;
  coverImageUrl: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  ogImageUrl: string;
}

const statuses: Array<{ value: AdminArticleStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "ARCHIVED", label: "Archived" },
];

function editorFromArticle(article: AdminArticle): EditorState {
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    category: article.category,
    takeaway: article.takeaway,
    sections: article.sections ?? [],
    authorName: article.authorName ?? "",
    tags: (article.tags ?? []).join(", "),
    coverImageUrl: article.coverImageUrl ?? "",
    seoTitle: article.seoTitle ?? "",
    seoDescription: article.seoDescription ?? "",
    canonicalUrl: article.canonicalUrl ?? "",
    ogImageUrl: article.ogImageUrl ?? "",
  };
}

function newSection(index: number): ArticleSection {
  return { id: `section-${index + 1}`, heading: `Section ${index + 1}`, paragraphs: [""] };
}

function statusLabel(status: AdminArticleStatus) {
  return status.charAt(0) + status.slice(1).toLocaleLowerCase("en-IN");
}

function dateLabel(value: string | null | undefined) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function toPublishIso(value: string) {
  if (!value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function AdminBlogManagement() {
  const [page, setPage] = useState<AdminArticlePage | null>(null);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AdminArticleStatus | "">("");
  const [category, setCategory] = useState<ArticleCategory | "">("");
  const [pageNumber, setPageNumber] = useState(1);
  const [selected, setSelected] = useState<AdminArticle | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [publishAt, setPublishAt] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<ArticleCategory>("Industry Insights");

  const loadList = useCallback(async (targetPage = pageNumber) => {
    setLoadingList(true);
    setError(null);
    try {
      const response = await listAdminArticles({ query, status, category, page: targetPage, pageSize: 20 });
      setPage(response.data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to load the editorial workspace.");
    } finally {
      setLoadingList(false);
    }
  }, [category, pageNumber, query, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadList(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadList]);

  async function openArticle(id: string) {
    if (dirty && selected && !window.confirm("You have unsaved article changes. Discard them and open another article?")) return;
    setLoadingArticle(true);
    setError(null);
    setMessage(null);
    try {
      const response = await getAdminArticle(id);
      setSelected(response.data);
      setEditor(editorFromArticle(response.data));
      setPublishAt(response.data.status === "SCHEDULED" && response.data.publishedAt ? new Date(response.data.publishedAt).toISOString().slice(0, 16) : "");
      setDirty(false);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to open this article.");
    } finally {
      setLoadingArticle(false);
    }
  }

  function patchEditor(patch: Partial<EditorState>) {
    setEditor(current => current ? { ...current, ...patch } : current);
    setDirty(true);
    setMessage(null);
  }

  function patchSection(index: number, patch: Partial<ArticleSection>) {
    if (!editor) return;
    const sections = editor.sections.map((section, position) => position === index ? { ...section, ...patch } : section);
    patchEditor({ sections });
  }

  function moveSection(index: number, direction: -1 | 1) {
    if (!editor) return;
    const target = index + direction;
    if (target < 0 || target >= editor.sections.length) return;
    const sections = [...editor.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    patchEditor({ sections });
  }

  function removeSection(index: number) {
    if (!editor || !window.confirm("Remove this section from the draft?")) return;
    patchEditor({ sections: editor.sections.filter((_, position) => position !== index) });
  }

  function patchSectionImage(sectionIndex: number, imageIndex: number, patch: Partial<ArticleImage>) {
    if (!editor) return;
    const section = editor.sections[sectionIndex];
    const images = [...(section.images ?? [])];
    images[imageIndex] = { ...images[imageIndex], ...patch };
    patchSection(sectionIndex, { images });
  }

  function addSectionImage(sectionIndex: number) {
    if (!editor) return;
    const images = [...(editor.sections[sectionIndex].images ?? []), { url: "", alt: "", caption: "" }];
    patchSection(sectionIndex, { images });
  }

  function removeSectionImage(sectionIndex: number, imageIndex: number) {
    if (!editor) return;
    patchSection(sectionIndex, { images: (editor.sections[sectionIndex].images ?? []).filter((_, position) => position !== imageIndex) });
  }

  function formattingSnippet(sectionIndex: number, kind: "bold" | "italic" | "link") {
    if (!editor) return;
    const snippets = { bold: "**bold text**", italic: "*italic text*", link: "[link text](https://example.com)" };
    const section = editor.sections[sectionIndex];
    const paragraphs = [...section.paragraphs];
    const last = Math.max(0, paragraphs.length - 1);
    paragraphs[last] = `${paragraphs[last] ?? ""}${paragraphs[last]?.trim() ? " " : ""}${snippets[kind]}`;
    patchSection(sectionIndex, { paragraphs });
  }

  function draftPayload(article: AdminArticle, state: EditorState): AdminArticleDraftInput {
    return {
      title: state.title.trim(), slug: state.slug.trim(), excerpt: state.excerpt.trim(), category: state.category, takeaway: state.takeaway.trim(),
      sections: state.sections.map(section => ({
        ...section,
        id: section.id.trim(), heading: section.heading.trim(),
        paragraphs: section.paragraphs.map(item => item.trim()).filter(Boolean),
        points: section.points?.map(item => item.trim()).filter(Boolean),
        quotes: section.quotes?.map(item => item.trim()).filter(Boolean),
        images: section.images?.map(image => ({ url: image.url.trim(), alt: image.alt.trim(), ...(image.caption?.trim() ? { caption: image.caption.trim() } : {}) })).filter(image => image.url && image.alt),
      })),
      authorName: state.authorName.trim() || null,
      tags: state.tags.split(",").map(item => item.trim()).filter(Boolean),
      coverImageUrl: state.coverImageUrl.trim() || null,
      seoTitle: state.seoTitle.trim() || null,
      seoDescription: state.seoDescription.trim() || null,
      canonicalUrl: state.canonicalUrl.trim() || null,
      ogImageUrl: state.ogImageUrl.trim() || null,
      expectedRevision: article.revision,
    };
  }

  async function saveDraft(): Promise<AdminArticle | null> {
    if (!selected || !editor) return null;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await updateAdminArticle(selected.id, draftPayload(selected, editor));
      setSelected(response.data);
      setEditor(editorFromArticle(response.data));
      setDirty(false);
      setMessage(selected.isPublished ? "Draft changes saved. The live article is unchanged until you publish this revision." : "Draft saved. Your editorial changes are secure.");
      await loadList();
      return response.data;
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to save this article.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function createArticle(event: FormEvent) {
    event.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const response = await createAdminArticle({ title: newTitle.trim(), category: newCategory });
      setCreateOpen(false);
      setNewTitle("");
      await loadList(1);
      await openArticle(response.data.id);
      setMessage("New draft created. Add the article content, then publish when ready.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to create the article draft.");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!selected || !editor) return;
    const article = dirty ? await saveDraft() : selected;
    if (!article) return;
    setSaving(true);
    setError(null);
    try {
      const iso = toPublishIso(publishAt);
      const response = await publishAdminArticle(article.id, article.revision, iso);
      setSelected(response.data);
      setEditor(editorFromArticle(response.data));
      setDirty(false);
      setMessage(response.data.status === "SCHEDULED" ? `Publication scheduled for ${dateLabel(response.data.publishedAt)}.` : "Article published to the public website.");
      await loadList();
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "ARTICLE_NOT_PUBLISHABLE" && caught.details && typeof caught.details === "object" && "problems" in caught.details && Array.isArray(caught.details.problems)) {
        setError((caught.details.problems as string[]).join(" "));
      } else setError(caught instanceof ApiError ? caught.message : "Unable to publish this article.");
    } finally {
      setSaving(false);
    }
  }

  async function lifecycle(action: "unpublish" | "archive" | "restore") {
    if (!selected) return;
    if (action === "archive" && !window.confirm("Archive this article? It will immediately disappear from the public blog if currently published.")) return;
    setSaving(true); setError(null); setMessage(null);
    try {
      const response = action === "archive" ? await archiveAdminArticle(selected.id, selected.revision)
        : action === "restore" ? await restoreAdminArticle(selected.id, selected.revision)
        : await unpublishAdminArticle(selected.id, selected.revision);
      setSelected(response.data); setEditor(editorFromArticle(response.data)); setDirty(false); setPublishAt("");
      setMessage(action === "archive" ? "Article archived." : action === "restore" ? "Article restored as a draft." : "Article returned to draft.");
      await loadList();
    } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to update the article lifecycle."); }
    finally { setSaving(false); }
  }

  const editorWords = useMemo(() => editor ? [editor.excerpt, editor.takeaway, ...editor.sections.flatMap(section => [section.heading, ...section.paragraphs, ...(section.points ?? []), ...(section.quotes ?? [])])].join(" ").trim().split(/\s+/).filter(Boolean).length : 0, [editor]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPageNumber(1);
    setQuery(queryInput.trim());
  }

  return (
    <div className="zbo-blog-cms">
      <section className="zbo-blog-cms-hero">
        <div>
          <p className="zbo-eyebrow">Content studio</p>
          <h1>Publish useful ideas without a code release.</h1>
          <p>Draft, review, schedule and publish ZOBHUNGER articles from one controlled editorial workspace.</p>
        </div>
        <div className="zbo-blog-cms-hero-actions">
          <Link href="/blogs" target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" />View public blog</Link>
          <button type="button" className="is-primary" onClick={() => setCreateOpen(true)}><Plus aria-hidden="true" />New article</button>
        </div>
      </section>

      <section className="zbo-blog-cms-kpis" aria-label="Editorial totals">
        <article><span><BookOpen aria-hidden="true" /></span><div><small>Published</small><strong>{page?.counts.published ?? 0}</strong></div></article>
        <article><span><FilePenLine aria-hidden="true" /></span><div><small>Drafts</small><strong>{page?.counts.drafts ?? 0}</strong></div></article>
        <article><span><CalendarClock aria-hidden="true" /></span><div><small>Scheduled</small><strong>{page?.counts.scheduled ?? 0}</strong></div></article>
        <article><span><Archive aria-hidden="true" /></span><div><small>Archived</small><strong>{page?.counts.archived ?? 0}</strong></div></article>
      </section>

      {error && <div className="zbo-blog-cms-alert is-error" role="alert"><X aria-hidden="true" /><span>{error}</span><button type="button" onClick={() => setError(null)}>Dismiss</button></div>}
      {message && <div className="zbo-blog-cms-alert is-success" role="status"><CheckCircle2 aria-hidden="true" /><span>{message}</span><button type="button" onClick={() => setMessage(null)}>Dismiss</button></div>}

      <section className="zbo-blog-cms-workspace">
        <aside className="zbo-blog-library" aria-label="Article library">
          <header>
            <div><span className="zbo-eyebrow">Article library</span><strong>{page?.total ?? 0} records</strong></div>
            <button type="button" aria-label="Refresh articles" title="Refresh articles" onClick={() => void loadList()} disabled={loadingList}><RefreshCw className={loadingList ? "zbo-spin" : ""} aria-hidden="true" /></button>
          </header>
          <form className="zbo-blog-library-filters" onSubmit={submitSearch}>
            <label><span>Search</span><div><Search aria-hidden="true" /><input value={queryInput} onChange={event => setQueryInput(event.target.value)} placeholder="Title, slug or author" maxLength={160} /></div></label>
            <div className="zbo-blog-filter-grid">
              <label><span>Status</span><select value={status} onChange={event => { setStatus(event.target.value as AdminArticleStatus | ""); setPageNumber(1); }}>{statuses.map(item => <option value={item.value} key={item.label}>{item.label}</option>)}</select></label>
              <label><span>Topic</span><select value={category} onChange={event => { setCategory(event.target.value as ArticleCategory | ""); setPageNumber(1); }}><option value="">All topics</option>{articleCategories.map(item => <option value={item} key={item}>{item}</option>)}</select></label>
            </div>
            <button type="submit">Search</button>
          </form>

          <div className="zbo-blog-library-list">
            {loadingList && !page ? <div className="zbo-blog-library-state"><LoaderCircle className="zbo-spin" aria-hidden="true" />Loading articles…</div>
              : page?.items.length ? page.items.map(item => (
                <button type="button" key={item.id} className={`zbo-blog-library-item${selected?.id === item.id ? " is-active" : ""}`} onClick={() => void openArticle(item.id)}>
                  <span className={`zbo-blog-status is-${item.status.toLocaleLowerCase("en-IN")}`}>{statusLabel(item.status)}</span>
                  {item.hasUnpublishedChanges && <em className="zbo-blog-draft-marker">Unpublished changes</em>}
                  <strong>{item.title}</strong>
                  <small>{item.category} · {item.readingMinutes} min</small>
                  <time dateTime={item.updatedAt}>Updated {dateLabel(item.updatedAt)}</time>
                </button>
              )) : <div className="zbo-blog-library-state"><FileText aria-hidden="true" /><strong>No articles found</strong><span>Adjust the filters or start a new draft.</span></div>}
          </div>

          {page && page.totalPages > 1 && <footer className="zbo-blog-library-pagination"><button type="button" disabled={page.page <= 1} onClick={() => setPageNumber(value => Math.max(1, value - 1))}><ChevronLeft aria-hidden="true" /></button><span>{page.page} / {page.totalPages}</span><button type="button" disabled={page.page >= page.totalPages} onClick={() => setPageNumber(value => Math.min(page.totalPages, value + 1))}><ChevronRight aria-hidden="true" /></button></footer>}
        </aside>

        <main className="zbo-blog-editor">
          {loadingArticle ? <div className="zbo-blog-editor-state"><LoaderCircle className="zbo-spin" aria-hidden="true" /><strong>Opening article</strong><span>Retrieving the latest editorial revision.</span></div>
            : selected && editor ? (
              <>
                <header className="zbo-blog-editor-toolbar">
                  <div><span className={`zbo-blog-status is-${selected.status.toLocaleLowerCase("en-IN")}`}>{statusLabel(selected.status)}</span><span>Revision {selected.revision}</span>{selected.hasUnpublishedChanges && !dirty && <span className="is-unsaved">Draft revision ready</span>}{dirty && <span className="is-unsaved">Unsaved changes</span>}</div>
                  <div className="zbo-blog-editor-actions">
                    {selected.status === "ARCHIVED" ? <button type="button" onClick={() => void lifecycle("restore")} disabled={saving}><RotateCcw aria-hidden="true" />Restore draft</button> : <>
                      <button type="button" onClick={() => void saveDraft()} disabled={saving || !dirty}><Save aria-hidden="true" />Save</button>
                      {(selected.status === "PUBLISHED" || selected.status === "SCHEDULED") && <button type="button" onClick={() => void lifecycle("unpublish")} disabled={saving}><FilePenLine aria-hidden="true" />Return to draft</button>}
                      <button type="button" className="is-publish" onClick={() => void publish()} disabled={saving}><Send aria-hidden="true" />{selected.status === "PUBLISHED" ? "Update live" : publishAt ? "Schedule" : "Publish"}</button>
                      <button type="button" className="is-icon-danger" aria-label="Archive article" title="Archive article" onClick={() => void lifecycle("archive")} disabled={saving}><Archive aria-hidden="true" /></button>
                    </>}
                  </div>
                </header>

                <div className={`zbo-blog-editor-body${selected.status === "ARCHIVED" ? " is-archived" : ""}`}>
                  <section className="zbo-blog-editor-main">
                    <div className="zbo-blog-editor-heading">
                      <div><span className="zbo-eyebrow">Article content</span><h2>{editor.title || "Untitled article"}</h2></div>
                      <div className="zbo-blog-word-count"><Sparkles aria-hidden="true" /><span><strong>{editorWords}</strong> words · ~{Math.max(1, Math.ceil(editorWords / 190))} min</span></div>
                    </div>

                    <div className="zbo-blog-form-grid is-two">
                      <label className="is-wide"><span>Article title</span><input value={editor.title} onChange={event => patchEditor({ title: event.target.value })} maxLength={180} disabled={selected.status === "ARCHIVED"} /></label>
                      <label><span>URL slug</span><div className="zbo-blog-input-prefix"><span>/blog/</span><input value={editor.slug} onChange={event => patchEditor({ slug: event.target.value.toLocaleLowerCase("en-IN").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") })} maxLength={180} disabled={selected.status === "ARCHIVED"} /></div></label>
                      <label><span>Topic</span><select value={editor.category} onChange={event => patchEditor({ category: event.target.value as ArticleCategory })} disabled={selected.status === "ARCHIVED"}>{articleCategories.map(item => <option value={item} key={item}>{item}</option>)}</select></label>
                      <label><span>Author</span><input value={editor.authorName} onChange={event => patchEditor({ authorName: event.target.value })} maxLength={120} placeholder="ZOBHUNGER Editorial Team" disabled={selected.status === "ARCHIVED"} /></label>
                      <label><span>Tags</span><input value={editor.tags} onChange={event => patchEditor({ tags: event.target.value })} placeholder="workforce, hiring, field sales" disabled={selected.status === "ARCHIVED"} /></label>
                      <label className="is-wide"><span>Excerpt</span><textarea value={editor.excerpt} onChange={event => patchEditor({ excerpt: event.target.value })} maxLength={420} rows={3} placeholder="A concise public summary for cards and search results." disabled={selected.status === "ARCHIVED"} /><small>{editor.excerpt.length}/420</small></label>
                      <label className="is-wide"><span>Key takeaway</span><textarea value={editor.takeaway} onChange={event => patchEditor({ takeaway: event.target.value })} maxLength={900} rows={3} placeholder="The single idea a reader should remember." disabled={selected.status === "ARCHIVED"} /></label>
                      <label className="is-wide"><span>Cover image URL</span><div className="zbo-blog-input-icon"><ImageIcon aria-hidden="true" /><input type="url" value={editor.coverImageUrl} onChange={event => patchEditor({ coverImageUrl: event.target.value })} placeholder="https://…" disabled={selected.status === "ARCHIVED"} /></div></label>
                    </div>

                    {editor.coverImageUrl && <figure className="zbo-blog-cover-preview"><img src={editor.coverImageUrl} alt="Cover preview" /><figcaption>Public cover preview</figcaption></figure>}

                    <div className="zbo-blog-sections-heading"><div><span className="zbo-eyebrow">Story structure</span><h3>Article sections</h3><p>Use clear sections and lightweight inline formatting. Raw HTML is never accepted.</p></div><button type="button" onClick={() => patchEditor({ sections: [...editor.sections, newSection(editor.sections.length)] })} disabled={selected.status === "ARCHIVED"}><CirclePlus aria-hidden="true" />Add section</button></div>

                    <div className="zbo-blog-sections">
                      {editor.sections.map((section, index) => (
                        <article className="zbo-blog-section-editor" key={`${index}-${section.id}`}>
                          <header><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{section.heading || `Section ${index + 1}`}</strong><small>/{section.id || "section-id"}</small></div><div><button type="button" aria-label="Move section up" disabled={index === 0 || selected.status === "ARCHIVED"} onClick={() => moveSection(index, -1)}><ArrowUp aria-hidden="true" /></button><button type="button" aria-label="Move section down" disabled={index === editor.sections.length - 1 || selected.status === "ARCHIVED"} onClick={() => moveSection(index, 1)}><ArrowDown aria-hidden="true" /></button><button type="button" className="is-danger" aria-label="Remove section" disabled={selected.status === "ARCHIVED"} onClick={() => removeSection(index)}><Trash2 aria-hidden="true" /></button></div></header>
                          <div className="zbo-blog-form-grid is-two">
                            <label><span>Section heading</span><input value={section.heading} onChange={event => patchSection(index, { heading: event.target.value })} maxLength={180} disabled={selected.status === "ARCHIVED"} /></label>
                            <label><span>Anchor ID</span><input value={section.id} onChange={event => patchSection(index, { id: event.target.value.toLocaleLowerCase("en-IN").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") })} maxLength={100} disabled={selected.status === "ARCHIVED"} /></label>
                            <label className="is-wide"><span>Paragraphs <small>Separate paragraphs with a blank line</small></span><div className="zbo-blog-format-toolbar"><button type="button" onClick={() => formattingSnippet(index, "bold")} disabled={selected.status === "ARCHIVED"}><Type aria-hidden="true" />Bold</button><button type="button" onClick={() => formattingSnippet(index, "italic")} disabled={selected.status === "ARCHIVED"}><FilePenLine aria-hidden="true" />Italic</button><button type="button" onClick={() => formattingSnippet(index, "link")} disabled={selected.status === "ARCHIVED"}><Link2 aria-hidden="true" />Link</button></div><textarea value={section.paragraphs.join("\n\n")} onChange={event => patchSection(index, { paragraphs: event.target.value.split(/\n\s*\n/) })} rows={8} placeholder="Write the section body here…" disabled={selected.status === "ARCHIVED"} /></label>
                            <label><span><List aria-hidden="true" /> Bullet points <small>One per line</small></span><textarea value={(section.points ?? []).join("\n")} onChange={event => patchSection(index, { points: event.target.value.split("\n") })} rows={5} disabled={selected.status === "ARCHIVED"} /></label>
                            <label><span><Quote aria-hidden="true" /> Pull quotes <small>Separate with a blank line</small></span><textarea value={(section.quotes ?? []).join("\n\n")} onChange={event => patchSection(index, { quotes: event.target.value.split(/\n\s*\n/) })} rows={5} disabled={selected.status === "ARCHIVED"} /></label>
                          </div>
                          <div className="zbo-blog-section-images"><div><strong>Section images</strong><button type="button" onClick={() => addSectionImage(index)} disabled={selected.status === "ARCHIVED"}><Plus aria-hidden="true" />Add image</button></div>{(section.images ?? []).map((image, imageIndex) => <div className="zbo-blog-section-image-row" key={imageIndex}><input type="url" placeholder="https://image…" value={image.url} onChange={event => patchSectionImage(index, imageIndex, { url: event.target.value })} disabled={selected.status === "ARCHIVED"} /><input placeholder="Accessible alt text" value={image.alt} onChange={event => patchSectionImage(index, imageIndex, { alt: event.target.value })} disabled={selected.status === "ARCHIVED"} /><input placeholder="Caption (optional)" value={image.caption ?? ""} onChange={event => patchSectionImage(index, imageIndex, { caption: event.target.value })} disabled={selected.status === "ARCHIVED"} /><button type="button" aria-label="Remove image" onClick={() => removeSectionImage(index, imageIndex)} disabled={selected.status === "ARCHIVED"}><Trash2 aria-hidden="true" /></button></div>)}</div>
                        </article>
                      ))}
                      {!editor.sections.length && <div className="zbo-blog-empty-editor"><FileText aria-hidden="true" /><strong>Build the article structure</strong><span>Add the first section when the headline, excerpt and takeaway are ready.</span><button type="button" onClick={() => patchEditor({ sections: [newSection(0)] })}>Add first section</button></div>}
                    </div>
                  </section>

                  <aside className="zbo-blog-editor-rail">
                    <section><span className="zbo-eyebrow">Publishing</span><h3>Release controls</h3><div className="zbo-blog-publish-facts"><div><span>Status</span><strong>{statusLabel(selected.status)}</strong></div><div><span>Published</span><strong>{dateLabel(selected.publishedAt)}</strong></div><div><span>Updated</span><strong>{dateLabel(selected.updatedAt)}</strong></div></div><label><span>Schedule publication <small>Leave blank for immediate</small></span><input type="datetime-local" value={publishAt} onChange={event => setPublishAt(event.target.value)} disabled={selected.status === "ARCHIVED"} /></label>{selected.status === "PUBLISHED" && <Link className="zbo-blog-public-link" href={`/blog/${encodeURIComponent(selected.liveSlug)}`} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" />Open live article</Link>}</section>

                    <section><span className="zbo-eyebrow">Search & sharing</span><h3>SEO metadata</h3><label><span>SEO title <small>{editor.seoTitle.length}/70</small></span><input value={editor.seoTitle} onChange={event => patchEditor({ seoTitle: event.target.value })} maxLength={70} placeholder={editor.title} disabled={selected.status === "ARCHIVED"} /></label><label><span>Meta description <small>{editor.seoDescription.length}/170</small></span><textarea value={editor.seoDescription} onChange={event => patchEditor({ seoDescription: event.target.value })} maxLength={170} rows={4} placeholder={editor.excerpt} disabled={selected.status === "ARCHIVED"} /></label><label><span>Canonical URL</span><input type="url" value={editor.canonicalUrl} onChange={event => patchEditor({ canonicalUrl: event.target.value })} placeholder="Leave blank to use the ZOBHUNGER URL" disabled={selected.status === "ARCHIVED"} /></label><label><span>Open Graph image</span><input type="url" value={editor.ogImageUrl} onChange={event => patchEditor({ ogImageUrl: event.target.value })} placeholder="Defaults to cover image" disabled={selected.status === "ARCHIVED"} /></label></section>

                    <section className="zbo-blog-seo-preview"><span className="zbo-eyebrow">Search preview</span><div><small>zobhungr.com › blog › {editor.slug || "article"}</small><strong>{editor.seoTitle || editor.title || "Article title"}</strong><p>{editor.seoDescription || editor.excerpt || "Add an excerpt or SEO description to preview the search result."}</p></div></section>
                  </aside>
                </div>
              </>
            ) : <div className="zbo-blog-editor-state"><BookOpen aria-hidden="true" /><strong>Select an article to edit</strong><span>Choose a draft from the library or create a new article.</span><button type="button" onClick={() => setCreateOpen(true)}><Plus aria-hidden="true" />New article</button></div>}
        </main>
      </section>

      {createOpen && <div className="zbo-blog-modal-backdrop" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) setCreateOpen(false); }}><section className="zbo-blog-modal" role="dialog" aria-modal="true" aria-labelledby="new-article-title"><header><div><span className="zbo-eyebrow">New editorial draft</span><h2 id="new-article-title">Start with the story, not the settings.</h2></div><button type="button" aria-label="Close" onClick={() => setCreateOpen(false)}><X aria-hidden="true" /></button></header><form onSubmit={createArticle}><label><span>Working title</span><input autoFocus value={newTitle} onChange={event => setNewTitle(event.target.value)} maxLength={180} placeholder="e.g. A practical guide to field workforce planning" /></label><label><span>Topic</span><select value={newCategory} onChange={event => setNewCategory(event.target.value as ArticleCategory)}>{articleCategories.map(item => <option value={item} key={item}>{item}</option>)}</select></label><p>A clean URL will be generated automatically. You can refine the slug, content and SEO metadata after the draft is created.</p><footer><button type="button" onClick={() => setCreateOpen(false)}>Cancel</button><button className="is-primary" type="submit" disabled={saving || !newTitle.trim()}>{saving ? <LoaderCircle className="zbo-spin" aria-hidden="true" /> : <CirclePlus aria-hidden="true" />}Create draft</button></footer></form></section></div>}
    </div>
  );
}
