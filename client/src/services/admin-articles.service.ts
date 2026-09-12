import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { ArticleCategory, ArticleSection } from "@/types/article.types";

export type AdminArticleStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

export interface AdminArticleSummary {
  id: string;
  slug: string;
  liveSlug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  readingMinutes: number;
  authorName: string | null;
  tags: string[];
  coverImageUrl: string | null;
  isPublished: boolean;
  isSample: boolean;
  publishedAt: string | null;
  archivedAt: string | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
  status: AdminArticleStatus;
  hasUnpublishedChanges: boolean;
}

export interface AdminArticle extends AdminArticleSummary {
  takeaway: string;
  sections: ArticleSection[];
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
}

export interface AdminArticlePage {
  items: AdminArticleSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: { published: number; drafts: number; scheduled: number; archived: number };
}

export interface AdminArticleFilters {
  query?: string;
  category?: ArticleCategory | "";
  status?: AdminArticleStatus | "";
  page?: number;
  pageSize?: number;
}

export interface AdminArticleDraftInput {
  title: string;
  slug: string;
  excerpt: string;
  category: ArticleCategory;
  takeaway: string;
  sections: ArticleSection[];
  authorName: string | null;
  tags: string[];
  coverImageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  expectedRevision: number;
}

function articleQuery(filters: AdminArticleFilters) {
  const params = new URLSearchParams();
  if (filters.query?.trim()) params.set("query", filters.query.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);
  params.set("page", String(filters.page ?? 1));
  params.set("pageSize", String(filters.pageSize ?? 20));
  return params;
}

export function listAdminArticles(filters: AdminArticleFilters = {}) {
  return apiFetch<ApiSuccessEnvelope<AdminArticlePage>>(`/admin/articles?${articleQuery(filters).toString()}`);
}

export function getAdminArticle(id: string) {
  return apiFetch<ApiSuccessEnvelope<AdminArticle>>(`/admin/articles/${encodeURIComponent(id)}`);
}

export function createAdminArticle(input: { title: string; slug?: string; category: ArticleCategory }) {
  return apiFetch<ApiSuccessEnvelope<AdminArticle>>("/admin/articles", { method: "POST", body: JSON.stringify(input) });
}

export function updateAdminArticle(id: string, input: AdminArticleDraftInput) {
  return apiFetch<ApiSuccessEnvelope<AdminArticle>>(`/admin/articles/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function publishAdminArticle(id: string, expectedRevision: number, publishAt?: string) {
  return apiFetch<ApiSuccessEnvelope<AdminArticle>>(`/admin/articles/${encodeURIComponent(id)}/publish`, { method: "POST", body: JSON.stringify({ expectedRevision, ...(publishAt ? { publishAt } : {}) }) });
}

export function unpublishAdminArticle(id: string, expectedRevision: number) {
  return apiFetch<ApiSuccessEnvelope<AdminArticle>>(`/admin/articles/${encodeURIComponent(id)}/unpublish`, { method: "POST", body: JSON.stringify({ expectedRevision }) });
}

export function archiveAdminArticle(id: string, expectedRevision: number) {
  return apiFetch<ApiSuccessEnvelope<AdminArticle>>(`/admin/articles/${encodeURIComponent(id)}/archive`, { method: "POST", body: JSON.stringify({ expectedRevision }) });
}

export function restoreAdminArticle(id: string, expectedRevision: number) {
  return apiFetch<ApiSuccessEnvelope<AdminArticle>>(`/admin/articles/${encodeURIComponent(id)}/restore`, { method: "POST", body: JSON.stringify({ expectedRevision }) });
}
