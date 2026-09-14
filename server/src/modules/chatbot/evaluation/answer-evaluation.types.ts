import type { ChatbotLanguage } from "../chatbot.language.js";

export interface AnswerEvaluationCase {
  id: string;
  question: string;
  expectedSourceUrls?: string[];
  requiredTerms?: string[];
  forbiddenTerms?: string[];
  shouldRefuse?: boolean;
  expectedLanguage?: ChatbotLanguage;
}

export interface AnswerEvaluationCaseResult {
  id: string;
  passed: boolean;
  grounded: boolean;
  unanswered: boolean;
  citationValid: boolean;
  sourceHit: boolean;
  requiredTermsPresent: boolean;
  forbiddenTermsAbsent: boolean;
  refusalCorrect: boolean;
  languageCorrect: boolean;
  citations: string[];
  sourceUrls: string[];
  failures: string[];
}

export interface AnswerEvaluationMetrics {
  cases: number;
  passed: number;
  passRate: number;
  citationAccuracy: number;
  sourceHitRate: number;
  refusalAccuracy: number;
  languageAccuracy: number;
  forbiddenClaimSafety: number;
}

export interface AnswerEvaluationReport {
  status: "passed" | "failed";
  generatedAt: string;
  metrics: AnswerEvaluationMetrics;
  results: AnswerEvaluationCaseResult[];
  failures: AnswerEvaluationCaseResult[];
}
