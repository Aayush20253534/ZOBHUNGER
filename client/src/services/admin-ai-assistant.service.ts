import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { ChatbotAudience } from "@/lib/chatbot";

export type AiKnowledgeStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type AiLeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CLOSED";
export type AiManagedAudience = Exclude<ChatbotAudience, "UNKNOWN">;

export interface AiKnowledgeDocument {
  id: string;
  slug: string;
  title: string;
  category: string;
  url: string;
  description: string | null;
  keywords: string[];
  aliases: string[];
  body: string;
  status: AiKnowledgeStatus;
  revision: number;
  verifiedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; email: string };
  updatedBy: { id: string; email: string };
  verifiedBy: { id: string; email: string } | null;
}

export interface AiPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AiLead {
  id: string;
  audience: AiManagedAudience;
  name: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  requirement: string;
  enquiryDetails: string | null;
  sourcePath: string | null;
  status: AiLeadStatus;
  intakeCaseId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiAssistantAnalytics {
  days: number;
  totals: {
    conversations: number;
    questions: number;
    answers: number;
    leads: number;
    unanswered: number;
    grounded: number;
    averageLatencyMs: number;
  };
  rates: { grounded: number; unanswered: number; leadConversion: number };
  audience: Partial<Record<ChatbotAudience, number>>;
  leadAudience: Partial<Record<AiManagedAudience, number>>;
  knowledge: Partial<Record<AiKnowledgeStatus, number>>;
  topUnanswered: Array<{ question: string; count: number }>;
}

export interface AiKnowledgeDraftInput {
  slug: string;
  title: string;
  category: string;
  url: string;
  description?: string;
  keywords: string[];
  aliases: string[];
  body: string;
}

function queryString(input: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) if (value !== undefined && value !== "") params.set(key, String(value));
  return params.toString();
}

export function getAiAssistantAnalytics(days = 30) {
  return apiFetch<ApiSuccessEnvelope<AiAssistantAnalytics>>(`/admin/ai-assistant/analytics?days=${days}`);
}

export function listAiKnowledge(input: { page?: number; query?: string; status?: AiKnowledgeStatus | ""; category?: string } = {}) {
  return apiFetch<ApiSuccessEnvelope<AiPage<AiKnowledgeDocument>>>(`/admin/ai-assistant/knowledge?${queryString({ page: input.page ?? 1, query: input.query, status: input.status || undefined, category: input.category })}`);
}

export function createAiKnowledge(input: AiKnowledgeDraftInput) {
  return apiFetch<ApiSuccessEnvelope<AiKnowledgeDocument>>("/admin/ai-assistant/knowledge", { method: "POST", body: JSON.stringify(input) });
}

export function updateAiKnowledge(id: string, input: Partial<Omit<AiKnowledgeDraftInput, "slug">> & { expectedRevision: number }) {
  return apiFetch<ApiSuccessEnvelope<AiKnowledgeDocument>>(`/admin/ai-assistant/knowledge/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function changeAiKnowledgeStatus(id: string, status: AiKnowledgeStatus, expectedRevision: number) {
  return apiFetch<ApiSuccessEnvelope<AiKnowledgeDocument>>(`/admin/ai-assistant/knowledge/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status, expectedRevision }) });
}

export function listAiLeads(input: { page?: number; query?: string; status?: AiLeadStatus | ""; audience?: AiManagedAudience | "" } = {}) {
  return apiFetch<ApiSuccessEnvelope<AiPage<AiLead>>>(`/admin/ai-assistant/leads?${queryString({ page: input.page ?? 1, query: input.query, status: input.status || undefined, audience: input.audience || undefined })}`);
}

export function changeAiLeadStatus(id: string, status: AiLeadStatus) {
  return apiFetch<ApiSuccessEnvelope<AiLead>>(`/admin/ai-assistant/leads/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}
