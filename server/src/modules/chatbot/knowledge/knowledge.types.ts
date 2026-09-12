export const KNOWLEDGE_CATEGORIES = [
  "company",
  "services",
  "industries",
  "workers",
  "businesses",
  "jobs",
  "partnerships",
  "case-studies",
  "contact",
  "policies",
] as const;

export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

export type KnowledgeStatus = "draft" | "published" | "archived";

export interface KnowledgeMetadata {
  id: string;
  title: string;
  category: KnowledgeCategory;
  url: string;
  keywords: string[];
  status: KnowledgeStatus;
  description?: string;
  aliases?: string[];
  updatedAt?: string;
}

export interface KnowledgeDocument {
  metadata: KnowledgeMetadata;
  body: string;
  absolutePath: string;
  relativePath: string;
}

export type KnowledgeValidationSeverity = "error" | "warning";

export interface KnowledgeValidationIssue {
  severity: KnowledgeValidationSeverity;
  code: string;
  message: string;
  file?: string;
}

export interface KnowledgeValidationResult {
  valid: boolean;
  documents: KnowledgeDocument[];
  issues: KnowledgeValidationIssue[];
  errorCount: number;
  warningCount: number;
}
