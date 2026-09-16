# AI Assistant / RAG

## Purpose

The ZOBHUNGER assistant answers questions about official services, jobs, partnerships and public company information while preferring grounded knowledge over free-form invention.

## Knowledge sources

Checked-in public knowledge lives under `server/src/modules/chatbot/knowledge/`. Those Markdown files are runtime application content and were intentionally preserved when the old developer documentation was deleted.

Administrators can also manage database-backed knowledge documents through the AI-assistant admin routes.

## Retrieval

The assistant supports lexical/semantic retrieval, reranking and optional dense retrieval with Gemini embeddings/pgvector. Reciprocal-rank fusion combines retrieval signals when vector mode is available. Vector failure can fall back to the non-vector retrieval path according to feature configuration.

## Generation

Groq chat completion is used for generation with configured primary/fallback models, completion-token ceiling, timeout and low default temperature.

## Grounding behavior

The platform has minimum grounding/citation expectations and evaluation cases. Unsupported questions should result in a bounded/helpful response or official navigation rather than fabricated ZOBHUNGER facts.

## Context and tools

The assistant can use public audience routing, multilingual behavior, conversation memory and selected authenticated context/tools. Authenticated tool answers are treated differently from public cached conversation content so private results are not accidentally persisted into public answer caches.

## Operational protection

- chatbot-specific rate limiting and duplicate-message guard;
- daily Groq/Gemini budgets;
- provider circuit breaker;
- bounded context/history;
- cache keys tied to knowledge/model context;
- evaluation/release-check scripts before deployment.
