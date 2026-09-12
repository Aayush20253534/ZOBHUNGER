import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/db.js";
import { HttpError } from "../../utils/http-error.js";
import { adminArticleWhere } from "./articles.repository.js";
import { articleSectionSchema, type AdminArticleListQuery, type ArticleRevisionActionInput, type CreateAdminArticleInput, type PublishAdminArticleInput, type UpdateAdminArticleInput } from "./articles.schema.js";

export interface ArticleAuditContext { ipAddress?: string; userAgent?: string }
export type AdminArticleStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

const draftSummarySelect = {
  slug: true, title: true, excerpt: true, category: true, readingMinutes: true,
  authorName: true, tags: true, coverImageUrl: true, isDirty: true, updatedAt: true,
} satisfies Prisma.ArticleDraftSelect;

const draftDetailSelect = {
  ...draftSummarySelect,
  takeaway: true, sections: true, seoTitle: true, seoDescription: true,
  canonicalUrl: true, ogImageUrl: true,
} satisfies Prisma.ArticleDraftSelect;

const listSelect = {
  id: true, slug: true, title: true, excerpt: true, category: true, readingMinutes: true,
  authorName: true, tags: true, coverImageUrl: true, isPublished: true, isSample: true,
  publishedAt: true, archivedAt: true, revision: true, createdAt: true, updatedAt: true,
  draft: { select: draftSummarySelect },
} satisfies Prisma.ArticleSelect;

const detailSelect = {
  id: true, slug: true, title: true, excerpt: true, category: true, readingMinutes: true,
  takeaway: true, sections: true, authorName: true, tags: true, coverImageUrl: true,
  seoTitle: true, seoDescription: true, canonicalUrl: true, ogImageUrl: true,
  isPublished: true, isSample: true, publishedAt: true, archivedAt: true,
  revision: true, createdAt: true, updatedAt: true,
  draft: { select: draftDetailSelect },
} satisfies Prisma.ArticleSelect;

type ListRow = Prisma.ArticleGetPayload<{ select: typeof listSelect }>;
type DetailRow = Prisma.ArticleGetPayload<{ select: typeof detailSelect }>;
type ArticleLifecycle = { isPublished: boolean; publishedAt: Date | null; archivedAt: Date | null };

type DraftShape = {
  slug: string; title: string; excerpt: string; category: string; readingMinutes: number; takeaway: string; sections: Prisma.JsonValue;
  authorName: string | null; tags: string[]; coverImageUrl: string | null; seoTitle: string | null; seoDescription: string | null;
  canonicalUrl: string | null; ogImageUrl: string | null; isDirty: boolean; updatedAt: Date;
};

function statusOf(row: ArticleLifecycle): AdminArticleStatus {
  if (row.archivedAt) return "ARCHIVED";
  if (!row.isPublished) return "DRAFT";
  return row.publishedAt && row.publishedAt.getTime() > Date.now() ? "SCHEDULED" : "PUBLISHED";
}

function summary(row: ListRow) {
  const source = row.draft ?? row;
  return {
    id: row.id,
    slug: source.slug,
    liveSlug: row.slug,
    title: source.title,
    excerpt: source.excerpt,
    category: source.category,
    readingMinutes: source.readingMinutes,
    authorName: source.authorName,
    tags: source.tags,
    coverImageUrl: source.coverImageUrl,
    isPublished: row.isPublished,
    isSample: row.isSample,
    publishedAt: row.publishedAt,
    archivedAt: row.archivedAt,
    revision: row.revision,
    createdAt: row.createdAt,
    updatedAt: row.draft?.updatedAt ?? row.updatedAt,
    status: statusOf(row),
    hasUnpublishedChanges: row.draft?.isDirty ?? false,
  };
}

function draftFromArticle(row: DetailRow): DraftShape {
  if (row.draft) return row.draft;
  return {
    slug: row.slug, title: row.title, excerpt: row.excerpt, category: row.category, readingMinutes: row.readingMinutes,
    takeaway: row.takeaway, sections: row.sections, authorName: row.authorName, tags: row.tags, coverImageUrl: row.coverImageUrl,
    seoTitle: row.seoTitle, seoDescription: row.seoDescription, canonicalUrl: row.canonicalUrl, ogImageUrl: row.ogImageUrl,
    isDirty: false, updatedAt: row.updatedAt,
  };
}

function detail(row: DetailRow) {
  const source = draftFromArticle(row);
  return {
    id: row.id,
    slug: source.slug,
    liveSlug: row.slug,
    title: source.title,
    excerpt: source.excerpt,
    category: source.category,
    readingMinutes: source.readingMinutes,
    takeaway: source.takeaway,
    sections: source.sections,
    authorName: source.authorName,
    tags: source.tags,
    coverImageUrl: source.coverImageUrl,
    seoTitle: source.seoTitle,
    seoDescription: source.seoDescription,
    canonicalUrl: source.canonicalUrl,
    ogImageUrl: source.ogImageUrl,
    isPublished: row.isPublished,
    isSample: row.isSample,
    publishedAt: row.publishedAt,
    archivedAt: row.archivedAt,
    revision: row.revision,
    createdAt: row.createdAt,
    updatedAt: source.updatedAt,
    status: statusOf(row),
    hasUnpublishedChanges: source.isDirty,
  };
}

function cleanNullable(value: string | null | undefined) { return typeof value === "string" ? (value.trim() || null) : value; }
function cleanTags(tags: string[] | undefined) {
  if (!tags) return tags;
  return [...new Map(tags.map(tag => [tag.trim().toLocaleLowerCase("en-IN"), tag.trim()])).values()].filter(Boolean).slice(0, 20);
}
function makeSlug(value: string) {
  return value.toLocaleLowerCase("en-IN").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 170) || "article";
}
async function uniqueSlug(base: string, ignoreId?: string) {
  const root = makeSlug(base);
  for (let index = 0; index < 100; index += 1) {
    const slug = index === 0 ? root : `${root.slice(0, Math.max(1, 176 - String(index + 1).length))}-${index + 1}`;
    const [live, draft] = await prisma.$transaction([
      prisma.article.findFirst({ where: { slug, ...(ignoreId ? { id: { not: ignoreId } } : {}) }, select: { id: true } }),
      prisma.articleDraft.findFirst({ where: { slug, ...(ignoreId ? { articleId: { not: ignoreId } } : {}) }, select: { articleId: true } }),
    ]);
    if (!live && !draft) return slug;
  }
  throw new HttpError(409, "A unique article URL could not be generated", { code: "ARTICLE_SLUG_CONFLICT" });
}

function parseSections(value: unknown) {
  const parsed = articleSectionSchema.array().safeParse(value);
  return parsed.success ? parsed.data : [];
}
function readingMinutes(excerpt: string, takeaway: string, sectionsValue: unknown) {
  const sections = parseSections(sectionsValue);
  const words = [excerpt, takeaway, ...sections.flatMap(section => [section.heading, ...section.paragraphs, ...(section.points ?? []), ...(section.quotes ?? []), ...(section.images ?? []).flatMap(image => [image.alt, image.caption ?? ""])])]
    .join(" ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 190));
}

function validatePublishable(row: DraftShape) {
  const problems: string[] = [];
  if (row.title.trim().length < 8) problems.push("Add a complete article title.");
  if (row.excerpt.trim().length < 30) problems.push("Add an excerpt of at least 30 characters.");
  if (row.takeaway.trim().length < 20) problems.push("Add a useful key takeaway.");
  const sections = parseSections(row.sections);
  if (!sections.length) problems.push("Add at least one content section.");
  if (sections.some(section => section.paragraphs.length === 0 && !(section.points?.length) && !(section.quotes?.length) && !(section.images?.length))) problems.push("Every section needs paragraph, list, quote or image content.");
  if (problems.length) throw new HttpError(400, "Complete the article before publishing", { code: "ARTICLE_NOT_PUBLISHABLE", details: { problems } });
}

async function articleOrThrow(id: string) {
  const row = await prisma.article.findUnique({ where: { id }, select: detailSelect });
  if (!row) throw new HttpError(404, "Article not found", { code: "ARTICLE_NOT_FOUND" });
  return row;
}

async function audit(tx: Prisma.TransactionClient, actorUserId: string, articleId: string, action: string, metadata: Prisma.InputJsonValue, context: ArticleAuditContext) {
  await tx.auditLog.create({ data: { actorUserId, entityType: "Article", entityId: articleId, action, metadata, ipAddress: context.ipAddress, userAgent: context.userAgent } });
}

export async function listAdminArticles(filters: AdminArticleListQuery) {
  const where = adminArticleWhere(filters);
  const skip = (filters.page - 1) * filters.pageSize;
  const now = new Date();
  const [rows, total, published, drafts, scheduled, archived] = await prisma.$transaction([
    prisma.article.findMany({ where, select: listSelect, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], skip, take: filters.pageSize }),
    prisma.article.count({ where }),
    prisma.article.count({ where: { isPublished: true, archivedAt: null, publishedAt: { lte: now } } }),
    prisma.article.count({ where: { isPublished: false, archivedAt: null } }),
    prisma.article.count({ where: { isPublished: true, archivedAt: null, publishedAt: { gt: now } } }),
    prisma.article.count({ where: { archivedAt: { not: null } } }),
  ]);
  return { items: rows.map(summary), total, page: filters.page, pageSize: filters.pageSize, totalPages: Math.max(1, Math.ceil(total / filters.pageSize)), counts: { published, drafts, scheduled, archived } };
}

export async function getAdminArticle(id: string) { return detail(await articleOrThrow(id)); }

export async function createAdminArticle(input: CreateAdminArticleInput, actorUserId: string, context: ArticleAuditContext) {
  const slug = await uniqueSlug(input.slug ?? input.title);
  const row = await prisma.$transaction(async tx => {
    const created = await tx.article.create({ data: {
      title: input.title.trim(), slug, category: input.category, excerpt: "", takeaway: "", sections: [], readingMinutes: 1,
      authorName: null, tags: [], isPublished: false, isSample: false,
      draft: { create: { title: input.title.trim(), slug, category: input.category, excerpt: "", takeaway: "", sections: [], readingMinutes: 1, authorName: null, tags: [], isDirty: true } },
    }, select: detailSelect });
    await audit(tx, actorUserId, created.id, "article.created", { slug, category: input.category }, context);
    return created;
  });
  return detail(row);
}

export async function updateAdminArticle(id: string, input: UpdateAdminArticleInput, actorUserId: string, context: ArticleAuditContext) {
  const current = await articleOrThrow(id);
  if (current.archivedAt) throw new HttpError(409, "Restore the article before editing it", { code: "ARTICLE_ARCHIVED" });
  const source = draftFromArticle(current);
  let slug = input.slug;
  if (slug !== undefined && slug !== source.slug) slug = await uniqueSlug(slug, id);
  const sections = input.sections !== undefined ? input.sections : parseSections(source.sections);
  const excerpt = input.excerpt ?? source.excerpt;
  const takeaway = input.takeaway ?? source.takeaway;
  const draftData = {
    title: input.title?.trim() ?? source.title,
    slug: slug ?? source.slug,
    excerpt: input.excerpt?.trim() ?? source.excerpt,
    category: input.category ?? source.category,
    takeaway: input.takeaway?.trim() ?? source.takeaway,
    sections: sections as unknown as Prisma.InputJsonValue,
    authorName: input.authorName !== undefined ? cleanNullable(input.authorName) : source.authorName,
    tags: input.tags !== undefined ? (cleanTags(input.tags) ?? []) : source.tags,
    coverImageUrl: input.coverImageUrl !== undefined ? cleanNullable(input.coverImageUrl) : source.coverImageUrl,
    seoTitle: input.seoTitle !== undefined ? cleanNullable(input.seoTitle) : source.seoTitle,
    seoDescription: input.seoDescription !== undefined ? cleanNullable(input.seoDescription) : source.seoDescription,
    canonicalUrl: input.canonicalUrl !== undefined ? cleanNullable(input.canonicalUrl) : source.canonicalUrl,
    ogImageUrl: input.ogImageUrl !== undefined ? cleanNullable(input.ogImageUrl) : source.ogImageUrl,
    readingMinutes: readingMinutes(excerpt, takeaway, sections),
    isDirty: true,
  };

  const updated = await prisma.$transaction(async tx => {
    const changed = await tx.article.updateMany({ where: { id, revision: input.expectedRevision, archivedAt: null }, data: { revision: { increment: 1 } } });
    if (changed.count !== 1) throw new HttpError(409, "This article changed while you were editing it. Refresh before saving.", { code: "ARTICLE_CHANGED" });
    await tx.articleDraft.upsert({ where: { articleId: id }, update: draftData, create: { articleId: id, ...draftData } });
    const row = await tx.article.findUniqueOrThrow({ where: { id }, select: detailSelect });
    await audit(tx, actorUserId, id, "article.draft_saved", { fields: Object.keys(input).filter(key => key !== "expectedRevision"), revision: row.revision, liveUnaffected: row.isPublished }, context);
    return row;
  });
  return detail(updated);
}

export async function publishAdminArticle(id: string, input: PublishAdminArticleInput, actorUserId: string, context: ArticleAuditContext) {
  const current = await articleOrThrow(id);
  if (current.archivedAt) throw new HttpError(409, "Restore the article before publishing it", { code: "ARTICLE_ARCHIVED" });
  const draft = draftFromArticle(current);
  validatePublishable(draft);
  const publishAt = input.publishAt ? new Date(input.publishAt) : new Date();
  const updated = await prisma.$transaction(async tx => {
    const changed = await tx.article.updateMany({
      where: { id, revision: input.expectedRevision, archivedAt: null },
      data: {
        title: draft.title, slug: draft.slug, excerpt: draft.excerpt, category: draft.category, readingMinutes: draft.readingMinutes,
        takeaway: draft.takeaway, sections: draft.sections as Prisma.InputJsonValue, authorName: draft.authorName, tags: draft.tags,
        coverImageUrl: draft.coverImageUrl, seoTitle: draft.seoTitle, seoDescription: draft.seoDescription, canonicalUrl: draft.canonicalUrl, ogImageUrl: draft.ogImageUrl,
        isPublished: true, publishedAt: publishAt, revision: { increment: 1 },
      },
    });
    if (changed.count !== 1) throw new HttpError(409, "This article changed while you were publishing it. Refresh before trying again.", { code: "ARTICLE_CHANGED" });
    await tx.articleDraft.update({ where: { articleId: id }, data: { isDirty: false } });
    const row = await tx.article.findUniqueOrThrow({ where: { id }, select: detailSelect });
    await audit(tx, actorUserId, id, publishAt.getTime() > Date.now() ? "article.scheduled" : "article.published", { publishedAt: publishAt.toISOString(), revision: row.revision }, context);
    return row;
  });
  return detail(updated);
}

async function revisionTransition(id: string, input: ArticleRevisionActionInput, actorUserId: string, context: ArticleAuditContext, action: "draft" | "archive" | "restore") {
  const current = await articleOrThrow(id);
  if (action === "archive" && current.archivedAt) return detail(current);
  if (action === "restore" && !current.archivedAt) return detail(current);
  const data: Prisma.ArticleUpdateManyMutationInput = action === "archive"
    ? { isPublished: false, archivedAt: new Date(), revision: { increment: 1 } }
    : { isPublished: false, publishedAt: null, ...(action === "restore" ? { archivedAt: null } : {}), revision: { increment: 1 } };
  const updated = await prisma.$transaction(async tx => {
    const changed = await tx.article.updateMany({ where: { id, revision: input.expectedRevision }, data });
    if (changed.count !== 1) throw new HttpError(409, "This article changed while you were updating it. Refresh before trying again.", { code: "ARTICLE_CHANGED" });
    const row = await tx.article.findUniqueOrThrow({ where: { id }, select: detailSelect });
    const auditAction = action === "draft" ? "article.unpublished" : action === "archive" ? "article.archived" : "article.restored";
    await audit(tx, actorUserId, id, auditAction, { revision: row.revision }, context);
    return row;
  });
  return detail(updated);
}

export const unpublishAdminArticle = (id: string, input: ArticleRevisionActionInput, actorUserId: string, context: ArticleAuditContext) => revisionTransition(id, input, actorUserId, context, "draft");
export const archiveAdminArticle = (id: string, input: ArticleRevisionActionInput, actorUserId: string, context: ArticleAuditContext) => revisionTransition(id, input, actorUserId, context, "archive");
export const restoreAdminArticle = (id: string, input: ArticleRevisionActionInput, actorUserId: string, context: ArticleAuditContext) => revisionTransition(id, input, actorUserId, context, "restore");
