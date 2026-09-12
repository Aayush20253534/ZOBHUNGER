# ZOBHUNGER local RAG retrieval engine

Phase 3 turns the published Markdown knowledge corpus into ranked context without calling an LLM or an external vector database.

## Pipeline

1. `loadKnowledgeBase()` reads only published Phase 2 knowledge documents.
2. `chunkKnowledgeDocument()` splits each document on H2 sections and then paragraph boundaries. Large sections are split into bounded chunks with a small overlap.
3. `buildKnowledgeIndex()` creates an in-memory lexical index for title, section, keywords, aliases, description and content fields.
4. `searchKnowledgeIndex()` normalizes the user query, applies controlled synonym expansion, IDF-weighted field scoring, full-query coverage weighting, category intent, current-page context and document-diversity ranking.
5. `formatKnowledgeContext()` turns the selected chunks into source-labelled, size-bounded text that Phase 4 can safely pass to Grok.

The index is built once by the default retriever and then reused for subsequent requests in the same server process.

## Search from the command line

From the repository root:

```bash
npm run chatbot:rag:search -- "I need promoters for my retail stores"
```

Add current-page context when testing ambiguous questions:

```bash
npm run chatbot:rag:search -- "How do I start this service?" --page /verification-services
```

Limit displayed results:

```bash
npm run chatbot:rag:search -- "How do vendors apply?" --top 3
```

## Default retrieval behavior

- Top results: 6
- Maximum chunks per document: 2
- Chunk target: about 2,200 characters
- Hard chunk maximum: about 3,200 characters
- Small overlap for split sections
- Exact current-page matches receive a contextual boost
- Weak results far below the strongest result are removed
- Repeated chunks from the same document receive a ranking penalty to preserve source diversity

These defaults can be overridden through the exported options when Phase 4 calls the retriever.

## Public-data boundary

The RAG engine consumes the same public knowledge corpus validated in Phases 1 and 2. It does not crawl or index private `/admin`, `/business`, `/worker` or `/employee-joining` records.
