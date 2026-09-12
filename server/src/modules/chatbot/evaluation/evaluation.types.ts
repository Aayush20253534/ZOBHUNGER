import type { KnowledgeCategory } from "../knowledge/knowledge.types.js";

export type RagEvaluationMode = "match" | "no-match";

export interface RagEvaluationCase {
  id: string;
  query: string;
  mode?: RagEvaluationMode;
  currentPage?: string;
  expectedDocumentIds?: string[];
  expectedCategories?: KnowledgeCategory[];
  topK?: number;
  description?: string;
}

export interface RagEvaluationCaseResult {
  id: string;
  query: string;
  mode: RagEvaluationMode;
  passed: boolean;
  topDocumentId: string | null;
  topCategory: KnowledgeCategory | null;
  expectedRank: number | null;
  hitAt1: boolean;
  hitAt3: boolean;
  categoryHitAt3: boolean;
  reciprocalRank: number;
  resultCount: number;
  returnedDocumentIds: string[];
  currentPage?: string;
}

export interface RagEvaluationMetrics {
  cases: number;
  matchCases: number;
  noMatchCases: number;
  passedCases: number;
  passRate: number;
  top1Accuracy: number;
  hitAt3: number;
  meanReciprocalRank: number;
  categoryHitAt3: number;
  noMatchAccuracy: number;
}

export interface RagEvaluationReport {
  status: "passed" | "failed";
  generatedAt: string;
  knowledgeFingerprint: string;
  documentCount: number;
  chunkCount: number;
  metrics: RagEvaluationMetrics;
  thresholds: RagEvaluationThresholds;
  failures: RagEvaluationCaseResult[];
  results: RagEvaluationCaseResult[];
}

export interface RagEvaluationThresholds {
  minPassRate: number;
  minTop1Accuracy: number;
  minHitAt3: number;
  minMeanReciprocalRank: number;
  minCategoryHitAt3: number;
  minNoMatchAccuracy: number;
}
