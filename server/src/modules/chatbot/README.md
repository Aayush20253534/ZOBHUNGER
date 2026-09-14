# ZOBHUNGER AI Assistant

The assistant is a grounded RAG and authenticated operations layer. Public answers come from verified ZOBHUNGER knowledge; logged-in Business, Worker and authorised Admin users can also use narrowly scoped server tools for their own platform data.

## Public endpoint

`POST /api/v1/chatbot/messages` and `POST /api/v1/chatbot/stream` accept a message, bounded recent history, an optional public `currentPage`, and an optional conversation id. Authentication is optional on these read paths. When a valid session exists, the server derives the actor from the session rather than trusting role or account identifiers from the browser.

Responses expose the answer, grounding/confidence state, public sources, citations (`S1`, `S2`, ...), safe actions and handover metadata. API keys, raw chunks, prompts and provider usage stay server-side.

## P0 retrieval and grounding

The retrieval path combines:

1. deterministic lexical/semantic-concept retrieval;
2. optional dense embedding retrieval in PostgreSQL `pgvector`;
3. reciprocal-rank fusion across the query and decomposed subqueries;
4. the existing Groq neural reranker;
5. the hard grounding threshold;
6. answer-level citation validation and one constrained citation-repair pass.

Dense retrieval is optional. The migration creates the `vector` extension, a 1536-dimension embedding table and an HNSW cosine index. Existing chunks are embedded lazily and refreshed when their content hash changes. If the vector provider or vector query fails, the request falls back to lexical retrieval rather than taking the assistant down.

```env
CHATBOT_VECTOR_ENABLED=true
GEMINI_API_KEY=...
GEMINI_EMBEDDING_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
CHATBOT_VECTOR_CANDIDATES=16
CHATBOT_RRF_K=60
```

Dense retrieval uses the native Gemini Embeddings REST API and requests 1536-dimensional vectors so the existing `pgvector vector(1536)` index remains unchanged. `gemini-embedding-2` is the default and uses Google's recommended asymmetric search formatting (`task: search result | query: ...` for queries and `title: ... | text: ...` for documents). Groq remains the generation/reranking provider.

## Citation grounding

Retrieved context is labelled `[S1]`, `[S2]`, etc. Company-specific claims are instructed to cite those labels. The server validates that a non-refusal answer contains only citations that correspond to the returned retrieved sources. Invalid or missing citations receive one repair attempt; a second failure becomes the normal safe unknown response.

## Auth-aware tools

`CHATBOT_TOOLS_ENABLED=true` enables deterministic tools that always enforce the authenticated server session:

- Worker job matching reads the current worker profile and live non-demo jobs.
- Business requirement-status lookup reads only requirements owned by the current business account.
- Authorised Admin operational summaries expose only metrics permitted by the admin department/permissions.
- The Business requirement copilot converts natural language into a structured draft preview.

Write tools are separate from chat generation. `POST /api/v1/chatbot/tools/execute` requires authentication, the normal write-request protection, a supported tool id and explicit confirmation. The model cannot directly write arbitrary database records. The first write tool saves a requirement **draft** only; final business submission remains a separate user action in the workspace.

## Query decomposition and multilingual support

`CHATBOT_DECOMPOSITION_ENABLED=true` splits multi-part questions into a bounded set of retrieval queries before fusion. `CHATBOT_MULTILINGUAL_ENABLED=true` detects English, Hindi (Devanagari) and Roman Hinglish and instructs the answer layer to stay in that language while preserving official names and URLs.

## Managed knowledge freshness/versioning

Managed knowledge supports `validFrom`, `validUntil`, `reviewDueAt`, `sourceVersion`, `ownerDepartment` and `supersedesDocumentId`. Only verified PUBLISHED documents that are currently valid and not overdue for review are added to live retrieval. The admin UI reports expired, overdue and soon-expiring sources. Editing a published record returns it to draft and requires verification again.

## Privacy and caching

Authenticated conversations bypass the public response cache and server-side public conversation memory so account-derived results cannot leak into a later signed-out session. Client responses produced by authenticated tools are visible for the current session but are not persisted into browser chat history. Tool action payloads are never written to local history. Public conversation memory remains bounded and pseudonymous.

## Evaluation

Two evaluation layers are available:

```bash
npm run chatbot:evaluate
npm run chatbot:evaluate:answers
npm run chatbot:release-check
```

`chatbot:evaluate` is the deterministic, provider-free retrieval benchmark used by release gates. `chatbot:evaluate:answers` is an explicit live quality benchmark that requires `CHATBOT_ENABLED=true` and a configured Groq key; it measures citation validity, expected-source hits, grounded/refusal correctness, multilingual behavior and forbidden-claim safety, writing `.release-artifacts/chatbot-answer-evaluation.json`. It is intentionally not part of ordinary offline CI because it makes paid provider calls.

`chatbot:release-check` remains offline. It validates the knowledge corpus, deterministic RAG quality, public-route/secret boundaries, prompt-injection invariants and model policy.

## Production rollout

After applying the P0/P1 migration:

```bash
npm run db:deploy
npm run db:generate
npm run build
```

Keep `CHATBOT_VECTOR_ENABLED=false` until `GEMINI_API_KEY` is configured and the target PostgreSQL database supports the migration's `vector` extension. The rest of P0/P1 continues to work through the existing lexical RAG path when dense retrieval is disabled.
