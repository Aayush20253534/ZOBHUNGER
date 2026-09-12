import type { KnowledgeCategory, KnowledgeDocument } from "../knowledge/knowledge.types.js";

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  title: string;
  category: KnowledgeCategory;
  url: string;
  description?: string;
  keywords: string[];
  aliases: string[];
  section: string;
  sectionPath: string[];
  content: string;
  sourcePath: string;
  estimatedTokens: number;
  ordinal: number;
}

export interface IndexedKnowledgeChunk extends KnowledgeChunk {
  normalized: {
    title: string;
    section: string;
    description: string;
    keywords: string;
    aliases: string;
    content: string;
  };
  terms: {
    title: Map<string, number>;
    section: Map<string, number>;
    description: Map<string, number>;
    keywords: Map<string, number>;
    aliases: Map<string, number>;
    content: Map<string, number>;
  };
  allTerms: Set<string>;
}

export interface KnowledgeIndex {
  chunks: IndexedKnowledgeChunk[];
  documentCount: number;
  chunkCount: number;
  documentFrequency: Map<string, number>;
}

export interface ChunkKnowledgeOptions {
  targetChars?: number;
  maxChars?: number;
  overlapChars?: number;
}

export interface BuildKnowledgeIndexOptions extends ChunkKnowledgeOptions {}

export interface KnowledgeSearchOptions {
  topK?: number;
  minScore?: number;
  maxChunksPerDocument?: number;
  currentPage?: string;
  preferredCategories?: KnowledgeCategory[];
  includeDebug?: boolean;
}

export interface KnowledgeSearchDebug {
  matchedTerms: string[];
  expandedTerms: string[];
  reasons: string[];
  lexicalScore: number;
  coverageScore: number;
  phraseScore: number;
  contextScore: number;
}

export interface KnowledgeSearchResult {
  chunk: KnowledgeChunk;
  score: number;
  debug?: KnowledgeSearchDebug;
}

export interface KnowledgeSearchResponse {
  query: string;
  normalizedQuery: string;
  results: KnowledgeSearchResult[];
  searchedChunks: number;
}

export interface KnowledgeRetriever {
  readonly index: KnowledgeIndex;
  search(query: string, options?: KnowledgeSearchOptions): KnowledgeSearchResponse;
}

export interface CreateKnowledgeRetrieverOptions extends BuildKnowledgeIndexOptions {
  documents?: KnowledgeDocument[];
}
