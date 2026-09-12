import type { KnowledgeCategory } from "../knowledge/index.js";
import {
  buildQueryPhrases,
  expandQueryTerms,
  normalizeSearchText,
  tokenize,
} from "./text-normalizer.js";
import type {
  IndexedKnowledgeChunk,
  KnowledgeIndex,
  KnowledgeSearchDebug,
  KnowledgeSearchOptions,
  KnowledgeSearchResponse,
  KnowledgeSearchResult,
} from "./rag.types.js";

const FIELD_WEIGHTS = {
  title: 7,
  section: 5.5,
  keywords: 5,
  aliases: 4.5,
  description: 2.2,
  content: 1,
} as const;

const CATEGORY_INTENT: Array<{ category: KnowledgeCategory; terms: Set<string>; weight: number }> = [
  { category: "contact", terms: new Set(["contact", "email", "phone", "address", "support"]), weight: 5 },
  { category: "partnerships", terms: new Set(["vendor", "partner", "partnership", "empanelment", "placement", "college", "institution", "campus"]), weight: 4 },
  { category: "jobs", terms: new Set(["job", "career", "vacancy", "employment", "role", "apply"]), weight: 3.5 },
  { category: "workers", terms: new Set(["worker", "candidate", "applicant"]), weight: 2.5 },
  { category: "businesses", terms: new Set(["business", "company", "client", "requirement", "hire"]), weight: 2.5 },
  { category: "case-studies", terms: new Set(["case", "study", "result", "project", "experience"]), weight: 3 },
  { category: "industries", terms: new Set(["industry", "sector", "retail", "fmcg", "bfsi", "fintech", "logistics", "telecom", "healthcare", "manufacturing"]), weight: 2 },
  { category: "services", terms: new Set(["service", "workforce", "promoter", "telecaller", "telesales", "verification", "development", "branding", "activation"]), weight: 2 },
  { category: "company", terms: new Set(["zobhunger", "about", "office", "presence", "location", "technology", "blog"]), weight: 2 },
];

function scoreTermFrequency(termFrequency: number, weight: number) {
  if (termFrequency <= 0) return 0;
  return weight * (1 + Math.log1p(Math.min(termFrequency, 5)));
}

function inverseDocumentFrequency(index: KnowledgeIndex, term: string) {
  const frequency = index.documentFrequency.get(term) ?? 0;
  return Math.log((index.chunkCount + 1) / (frequency + 1)) + 1;
}

function normalizedPath(value?: string) {
  if (!value) return "";
  const withoutQuery = value.split(/[?#]/, 1)[0] ?? "";
  if (!withoutQuery) return "";
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) return withoutQuery.slice(0, -1);
  return withoutQuery;
}

function scoreCategoryIntent(chunk: IndexedKnowledgeChunk, originalTerms: string[]) {
  let score = 0;
  const reasons: string[] = [];
  for (const intent of CATEGORY_INTENT) {
    if (intent.category !== chunk.category) continue;
    const matches = originalTerms.filter((term) => intent.terms.has(term));
    if (matches.length === 0) continue;
    const categoryScore = Math.min(intent.weight + (matches.length - 1) * 0.75, intent.weight + 2);
    score += categoryScore;
    reasons.push(`category intent: ${chunk.category}`);
  }
  return { score, reasons };
}

function scorePhraseMatches(chunk: IndexedKnowledgeChunk, phrases: string[]) {
  let score = 0;
  const reasons: string[] = [];
  for (const phrase of phrases) {
    if (phrase.length < 5) continue;
    if (chunk.normalized.title.includes(phrase)) {
      score += 7;
      reasons.push(`title phrase: ${phrase}`);
    } else if (chunk.normalized.section.includes(phrase)) {
      score += 5;
      reasons.push(`section phrase: ${phrase}`);
    } else if (chunk.normalized.keywords.includes(phrase) || chunk.normalized.aliases.includes(phrase)) {
      score += 4;
      reasons.push(`metadata phrase: ${phrase}`);
    } else if (chunk.normalized.content.includes(phrase)) {
      score += 1.5;
      reasons.push(`content phrase: ${phrase}`);
    }
  }
  return { score: Math.min(score, 16), reasons };
}

function scoreChunk(
  index: KnowledgeIndex,
  chunk: IndexedKnowledgeChunk,
  originalTerms: string[],
  phrases: string[],
  options: KnowledgeSearchOptions,
): { score: number; debug: KnowledgeSearchDebug } {
  const expandedTerms = expandQueryTerms(originalTerms);
  const matchedOriginal = new Set<string>();
  const matchedExpanded = new Set<string>();
  const reasons: string[] = [];
  let lexicalScore = 0;

  for (const queryTerm of expandedTerms) {
    const idf = inverseDocumentFrequency(index, queryTerm.term);
    let termScore = 0;

    for (const [fieldName, fieldWeight] of Object.entries(FIELD_WEIGHTS) as Array<
      [keyof typeof FIELD_WEIGHTS, number]
    >) {
      const frequency = chunk.terms[fieldName].get(queryTerm.term) ?? 0;
      if (!frequency) continue;
      termScore += scoreTermFrequency(frequency, fieldWeight);
    }

    if (termScore <= 0) continue;
    lexicalScore += termScore * idf * queryTerm.weight;
    if (queryTerm.original) matchedOriginal.add(queryTerm.term);
    else matchedExpanded.add(queryTerm.term);
  }

  const coverage = originalTerms.length === 0 ? 0 : matchedOriginal.size / new Set(originalTerms).size;
  const coverageScore = coverage * 8 + (coverage === 1 && originalTerms.length > 1 ? 4 : 0);

  const phrase = scorePhraseMatches(chunk, phrases);
  reasons.push(...phrase.reasons);

  let contextScore = 0;
  const currentPage = normalizedPath(options.currentPage);
  const chunkUrl = normalizedPath(chunk.url);
  if (currentPage && currentPage === chunkUrl) {
    contextScore += 9;
    reasons.push("current page exact match");
  } else if (
    currentPage &&
    chunkUrl !== "/" &&
    (currentPage.startsWith(`${chunkUrl}/`) || chunkUrl.startsWith(`${currentPage}/`))
  ) {
    contextScore += 3;
    reasons.push("current page related path");
  }

  if (options.preferredCategories?.includes(chunk.category)) {
    contextScore += 4;
    reasons.push(`preferred category: ${chunk.category}`);
  }

  const categoryIntent = scoreCategoryIntent(chunk, originalTerms);
  contextScore += categoryIntent.score;
  reasons.push(...categoryIntent.reasons);

  if (matchedOriginal.size > 0) reasons.push(`matched ${matchedOriginal.size}/${new Set(originalTerms).size} query terms`);
  if (matchedExpanded.size > 0) reasons.push(`matched ${matchedExpanded.size} synonym terms`);

  let score = lexicalScore + coverageScore + phrase.score + contextScore;
  if (matchedOriginal.size === 0) {
    score *= 0.25;
  } else {
    score *= 0.45 + coverage * 0.55;
  }

  return {
    score,
    debug: {
      matchedTerms: [...matchedOriginal].sort(),
      expandedTerms: [...matchedExpanded].sort(),
      reasons: [...new Set(reasons)],
      lexicalScore,
      coverageScore,
      phraseScore: phrase.score,
      contextScore,
    },
  };
}

export function searchKnowledgeIndex(
  index: KnowledgeIndex,
  query: string,
  options: KnowledgeSearchOptions = {},
): KnowledgeSearchResponse {
  const normalizedQuery = normalizeSearchText(query);
  const originalTerms = tokenize(query);
  const phrases = buildQueryPhrases(originalTerms);
  const topK = Math.max(1, Math.min(options.topK ?? 6, 20));
  const minScore = Math.max(0, options.minScore ?? 2.5);
  const maxChunksPerDocument = Math.max(1, Math.min(options.maxChunksPerDocument ?? 2, 5));

  if (!normalizedQuery || originalTerms.length === 0) {
    return { query, normalizedQuery, results: [], searchedChunks: index.chunkCount };
  }

  const rawScored = index.chunks
    .map((chunk) => ({ chunk, ...scoreChunk(index, chunk, originalTerms, phrases, options) }))
    .filter((entry) => Number.isFinite(entry.score) && entry.score >= minScore)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.chunk.documentId !== b.chunk.documentId) return a.chunk.documentId.localeCompare(b.chunk.documentId);
      return a.chunk.ordinal - b.chunk.ordinal;
    });

  const relativeFloor = (rawScored[0]?.score ?? 0) * 0.08;
  const competitiveScored = rawScored.filter((entry) => entry.score >= Math.max(minScore, relativeFloor));

  const occurrenceByDocument = new Map<string, number>();
  const scored = competitiveScored
    .map((entry) => {
      const occurrence = occurrenceByDocument.get(entry.chunk.documentId) ?? 0;
      occurrenceByDocument.set(entry.chunk.documentId, occurrence + 1);
      const diversityFactor = Math.pow(0.78, occurrence);
      if (occurrence > 0) entry.debug.reasons.push(`document diversity penalty: ${occurrence + 1} chunk`);
      return { ...entry, rankScore: entry.score * diversityFactor };
    })
    .sort((a, b) => {
      if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
      if (b.score !== a.score) return b.score - a.score;
      if (a.chunk.documentId !== b.chunk.documentId) return a.chunk.documentId.localeCompare(b.chunk.documentId);
      return a.chunk.ordinal - b.chunk.ordinal;
    });

  const perDocument = new Map<string, number>();
  const results: KnowledgeSearchResult[] = [];
  const seenContent = new Set<string>();

  for (const entry of scored) {
    const count = perDocument.get(entry.chunk.documentId) ?? 0;
    if (count >= maxChunksPerDocument) continue;

    const contentFingerprint = normalizeSearchText(entry.chunk.content).slice(0, 180);
    if (contentFingerprint && seenContent.has(contentFingerprint)) continue;

    perDocument.set(entry.chunk.documentId, count + 1);
    if (contentFingerprint) seenContent.add(contentFingerprint);
    results.push({
      chunk: {
        id: entry.chunk.id,
        documentId: entry.chunk.documentId,
        title: entry.chunk.title,
        category: entry.chunk.category,
        url: entry.chunk.url,
        description: entry.chunk.description,
        keywords: [...entry.chunk.keywords],
        aliases: [...entry.chunk.aliases],
        section: entry.chunk.section,
        sectionPath: [...entry.chunk.sectionPath],
        content: entry.chunk.content,
        sourcePath: entry.chunk.sourcePath,
        estimatedTokens: entry.chunk.estimatedTokens,
        ordinal: entry.chunk.ordinal,
      },
      score: Number(entry.rankScore.toFixed(4)),
      debug: options.includeDebug ? entry.debug : undefined,
    });

    if (results.length >= topK) break;
  }

  return {
    query,
    normalizedQuery,
    results,
    searchedChunks: index.chunkCount,
  };
}
