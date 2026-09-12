export { chunkKnowledgeBase, chunkKnowledgeDocument } from "./knowledge-chunker.js";
export { buildKnowledgeIndex } from "./knowledge-index.js";
export { searchKnowledgeIndex } from "./knowledge-search.js";
export {
  createKnowledgeRetriever,
  getDefaultKnowledgeRetriever,
  resetDefaultKnowledgeRetrieverForTests,
  searchKnowledge,
} from "./knowledge-retriever.js";
export { formatKnowledgeContext } from "./context-formatter.js";
export { normalizeSearchText, tokenize } from "./text-normalizer.js";
export type {
  BuildKnowledgeIndexOptions,
  ChunkKnowledgeOptions,
  CreateKnowledgeRetrieverOptions,
  IndexedKnowledgeChunk,
  KnowledgeChunk,
  KnowledgeIndex,
  KnowledgeRetriever,
  KnowledgeSearchDebug,
  KnowledgeSearchOptions,
  KnowledgeSearchResponse,
  KnowledgeSearchResult,
} from "./rag.types.js";
