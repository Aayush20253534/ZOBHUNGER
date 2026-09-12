# ZOBHUNGER public RAG chatbot API

The public chatbot uses the version-controlled Markdown knowledge corpus, the local lexical RAG retriever, and Groq Chat Completions. Phase 7 adds production safeguards without changing the public response contract.

## Endpoint

`POST /api/v1/chatbot/messages`

The browser sends a message, bounded recent history and an optional public `currentPage`. The API returns only the generated answer, grounding flag and safe public ZOBHUNGER source links. API keys, raw knowledge chunks, hidden prompts, provider metadata and token usage are never returned to the client.

## Production flow

1. Global API + chatbot rate limits run.
2. The request body is validated and private portal page context is rejected.
3. A duplicate-message guard limits repeated identical requests per hashed client.
4. History-free public questions may use the short-lived Redis response cache.
5. Cache identity includes the knowledge fingerprint and Groq model/prompt signature, so knowledge/model changes automatically stop matching older entries.
6. A cache miss runs local RAG retrieval, builds bounded context and calls Groq.
7. Only grounded successful first-turn answers are cacheable. Follow-up conversations always run through RAG + Groq.
8. Structured logs record latency, grounding, source counts, cache status and provider usage without recording the user's raw message.
9. Aggregate in-process metrics are exposed through the existing API health payload for operational monitoring.

## Cache behavior

```env
CHATBOT_CACHE_ENABLED=true
CHATBOT_CACHE_TTL_SECONDS=300
```

Redis is optional for availability: if it is not ready, chatbot requests bypass persistent caching and still work. The cache also coalesces identical concurrent first-turn requests inside one API process. Ungrounded answers and provider errors are never stored.

## Abuse controls

The normal chatbot rate limit is supplemented by an identical-message guard:

```env
CHATBOT_DUPLICATE_WINDOW_MS=60000
CHATBOT_DUPLICATE_MAX=4
```

The key uses a server-keyed HMAC client fingerprint plus a normalized message/page digest. Raw IP addresses are not sent to Groq. The same pseudonymous fingerprint is supplied through Groq's optional `user` field to improve provider-side abuse monitoring.

## Observability

Every completed chatbot request emits `chatbot.request.completed` with operational metadata such as request ID, character count, history count, page, latency, cache status, grounding, source count, provider response/model and token/timing usage when Groq returns it. Failures emit `chatbot.request.failed` with only stable error/status metadata.

The `/health` response includes a safe chatbot summary: enabled/initialized state, cache readiness, configured model, knowledge document/chunk counts after initialization, a shortened knowledge fingerprint and aggregate request/error/cache/latency/token counters. It performs no paid provider probe.

## Required environment

The feature remains off by default. To enable it:

```env
CHATBOT_ENABLED=true
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b
GROQ_FALLBACK_MODEL=openai/gpt-oss-20b
CHATBOT_CACHE_ENABLED=true
```

`GROQ_REASONING_EFFORT` remains optional because model support varies. Production startup rejects an enabled chatbot without a Groq key, a non-HTTPS Groq endpoint, or an enabled chatbot cache while Redis itself is explicitly disabled.

## Safety boundaries

The public chatbot has no private database/tool access. It cannot use `/admin`, `/business`, `/worker` or employee-joining routes as page context. Retrieved Markdown is reference material rather than executable instructions, and ZOBHUNGER-specific factual claims must be grounded in retrieved public knowledge.
