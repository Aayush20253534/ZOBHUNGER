import type { KnowledgeRetriever } from "../rag/rag.types.js";
import { ragEvaluationCases } from "./evaluation-cases.js";
import type {
  RagEvaluationCase,
  RagEvaluationCaseResult,
  RagEvaluationMetrics,
  RagEvaluationReport,
  RagEvaluationThresholds,
} from "./evaluation.types.js";

export const defaultRagEvaluationThresholds: RagEvaluationThresholds = {
  minPassRate: 0.95,
  minTop1Accuracy: 0.75,
  minHitAt3: 0.95,
  minMeanReciprocalRank: 0.82,
  minCategoryHitAt3: 0.95,
  minNoMatchAccuracy: 1,
};

function round(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

function evaluateCase(retriever: KnowledgeRetriever, testCase: RagEvaluationCase): RagEvaluationCaseResult {
  const mode = testCase.mode ?? "match";
  const topK = Math.max(testCase.topK ?? 5, 3);
  const response = retriever.search(testCase.query, {
    topK,
    ...(testCase.currentPage ? { currentPage: testCase.currentPage } : {}),
  });
  const results = response.results;
  const returnedDocumentIds = results.map((result) => result.chunk.documentId);
  const expected = new Set(testCase.expectedDocumentIds ?? []);
  const expectedCategories = new Set(testCase.expectedCategories ?? []);
  const expectedIndex = returnedDocumentIds.findIndex((id) => expected.has(id));
  const expectedRank = expectedIndex >= 0 ? expectedIndex + 1 : null;
  const hitAt1 = mode === "match" && expectedRank === 1;
  const hitAt3 = mode === "match" && expectedRank !== null && expectedRank <= 3;
  const categoryHitAt3 = mode === "match"
    && (expectedCategories.size === 0 || results.slice(0, 3).some((result) => expectedCategories.has(result.chunk.category)));
  const reciprocalRank = mode === "match" && expectedRank ? 1 / expectedRank : 0;
  const noMatchPassed = mode === "no-match" && results.length === 0;
  const passed = mode === "no-match" ? noMatchPassed : hitAt3 && categoryHitAt3;

  return {
    id: testCase.id,
    query: testCase.query,
    mode,
    passed,
    topDocumentId: results[0]?.chunk.documentId ?? null,
    topCategory: results[0]?.chunk.category ?? null,
    expectedRank,
    hitAt1,
    hitAt3,
    categoryHitAt3,
    reciprocalRank: round(reciprocalRank),
    resultCount: results.length,
    returnedDocumentIds,
    ...(testCase.currentPage ? { currentPage: testCase.currentPage } : {}),
  };
}

function calculateMetrics(results: RagEvaluationCaseResult[]): RagEvaluationMetrics {
  const matchResults = results.filter((result) => result.mode === "match");
  const noMatchResults = results.filter((result) => result.mode === "no-match");
  const divide = (numerator: number, denominator: number) => denominator ? numerator / denominator : 1;

  return {
    cases: results.length,
    matchCases: matchResults.length,
    noMatchCases: noMatchResults.length,
    passedCases: results.filter((result) => result.passed).length,
    passRate: round(divide(results.filter((result) => result.passed).length, results.length)),
    top1Accuracy: round(divide(matchResults.filter((result) => result.hitAt1).length, matchResults.length)),
    hitAt3: round(divide(matchResults.filter((result) => result.hitAt3).length, matchResults.length)),
    meanReciprocalRank: round(divide(matchResults.reduce((sum, result) => sum + result.reciprocalRank, 0), matchResults.length)),
    categoryHitAt3: round(divide(matchResults.filter((result) => result.categoryHitAt3).length, matchResults.length)),
    noMatchAccuracy: round(divide(noMatchResults.filter((result) => result.passed).length, noMatchResults.length)),
  };
}

function passesThresholds(metrics: RagEvaluationMetrics, thresholds: RagEvaluationThresholds) {
  return metrics.passRate >= thresholds.minPassRate
    && metrics.top1Accuracy >= thresholds.minTop1Accuracy
    && metrics.hitAt3 >= thresholds.minHitAt3
    && metrics.meanReciprocalRank >= thresholds.minMeanReciprocalRank
    && metrics.categoryHitAt3 >= thresholds.minCategoryHitAt3
    && metrics.noMatchAccuracy >= thresholds.minNoMatchAccuracy;
}

export function evaluateRagRetriever(
  retriever: KnowledgeRetriever,
  options: {
    cases?: RagEvaluationCase[];
    thresholds?: RagEvaluationThresholds;
  } = {},
): RagEvaluationReport {
  const cases = options.cases ?? ragEvaluationCases;
  const thresholds = options.thresholds ?? defaultRagEvaluationThresholds;
  const results = cases.map((testCase) => evaluateCase(retriever, testCase));
  const metrics = calculateMetrics(results);

  return {
    status: passesThresholds(metrics, thresholds) ? "passed" : "failed",
    generatedAt: new Date().toISOString(),
    knowledgeFingerprint: retriever.fingerprint,
    documentCount: retriever.index.documentCount,
    chunkCount: retriever.index.chunkCount,
    metrics,
    thresholds,
    failures: results.filter((result) => !result.passed),
    results,
  };
}
