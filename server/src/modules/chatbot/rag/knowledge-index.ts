import type { KnowledgeDocument } from "../knowledge/knowledge.types.js";
import { chunkKnowledgeBase } from "./knowledge-chunker.js";
import { termFrequency, tokenize } from "./text-normalizer.js";
import type {
  BuildKnowledgeIndexOptions,
  IndexedKnowledgeChunk,
  KnowledgeIndex,
} from "./rag.types.js";

function indexField(value: string) {
  return termFrequency(tokenize(value));
}

export function buildKnowledgeIndex(
  documents: KnowledgeDocument[],
  options: BuildKnowledgeIndexOptions = {},
): KnowledgeIndex {
  const chunks = chunkKnowledgeBase(documents, options).map<IndexedKnowledgeChunk>((chunk) => {
    const description = chunk.description ?? "";
    const keywords = chunk.keywords.join(" ");
    const aliases = chunk.aliases.join(" ");
    const normalized = {
      title: tokenize(chunk.title).join(" "),
      section: tokenize(chunk.sectionPath.join(" ")).join(" "),
      description: tokenize(description).join(" "),
      keywords: tokenize(keywords).join(" "),
      aliases: tokenize(aliases).join(" "),
      content: tokenize(chunk.content).join(" "),
    };
    const terms = {
      title: indexField(chunk.title),
      section: indexField(chunk.sectionPath.join(" ")),
      description: indexField(description),
      keywords: indexField(keywords),
      aliases: indexField(aliases),
      content: indexField(chunk.content),
    };
    const allTerms = new Set<string>();
    for (const field of Object.values(terms)) {
      for (const term of field.keys()) allTerms.add(term);
    }

    return { ...chunk, normalized, terms, allTerms };
  });

  const documentFrequency = new Map<string, number>();
  for (const chunk of chunks) {
    for (const term of chunk.allTerms) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }

  return {
    chunks,
    documentCount: documents.length,
    chunkCount: chunks.length,
    documentFrequency,
  };
}
