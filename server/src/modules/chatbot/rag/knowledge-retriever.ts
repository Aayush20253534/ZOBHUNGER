import { createHash } from "node:crypto";
import { loadKnowledgeBase } from "../knowledge/index.js";
import { buildKnowledgeIndex } from "./knowledge-index.js";
import { searchKnowledgeIndex } from "./knowledge-search.js";
import type {
  CreateKnowledgeRetrieverOptions,
  KnowledgeRetriever,
  KnowledgeSearchOptions,
  KnowledgeSearchResponse,
} from "./rag.types.js";

let defaultRetrieverPromise: Promise<KnowledgeRetriever> | null = null;

function knowledgeFingerprint(documents: NonNullable<CreateKnowledgeRetrieverOptions["documents"]>): string {
  const hash = createHash("sha256");
  const ordered = [...documents].sort((a, b) => a.metadata.id.localeCompare(b.metadata.id));
  for (const document of ordered) {
    hash.update(JSON.stringify({
      id: document.metadata.id,
      title: document.metadata.title,
      category: document.metadata.category,
      url: document.metadata.url,
      keywords: document.metadata.keywords,
      aliases: document.metadata.aliases,
      description: document.metadata.description,
      updatedAt: document.metadata.updatedAt,
      body: document.body,
    }));
    hash.update("\n");
  }
  return hash.digest("hex");
}

export async function createKnowledgeRetriever(
  options: CreateKnowledgeRetrieverOptions = {},
): Promise<KnowledgeRetriever> {
  let documents = options.documents;

  if (!documents) {
    const loaded = await loadKnowledgeBase();
    if (loaded.issues.length > 0) {
      const details = loaded.issues.map((issue) => `${issue.file ?? "knowledge"}: ${issue.message}`).join("; ");
      throw new Error(`Cannot build chatbot knowledge index: ${details}`);
    }
    documents = loaded.documents;
  }

  const index = buildKnowledgeIndex(documents, options);
  const fingerprint = knowledgeFingerprint(documents);

  return {
    index,
    fingerprint,
    search(query: string, searchOptions: KnowledgeSearchOptions = {}) {
      return searchKnowledgeIndex(index, query, searchOptions);
    },
  };
}

export function getDefaultKnowledgeRetriever(): Promise<KnowledgeRetriever> {
  if (!defaultRetrieverPromise) defaultRetrieverPromise = createKnowledgeRetriever();
  return defaultRetrieverPromise;
}

export async function searchKnowledge(
  query: string,
  options: KnowledgeSearchOptions = {},
): Promise<KnowledgeSearchResponse> {
  const retriever = await getDefaultKnowledgeRetriever();
  return retriever.search(query, options);
}

export function resetDefaultKnowledgeRetrieverForTests() {
  defaultRetrieverPromise = null;
}
