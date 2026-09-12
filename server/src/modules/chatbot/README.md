# ZOBHUNGER public RAG chatbot API

Phase 4 connects the local Phase 3 knowledge retriever to Groq's OpenAI-compatible Chat Completions API. It is server-only: the browser never receives the Groq API key or raw knowledge context.

## Endpoint

`POST /api/v1/chatbot/messages`

Example request:

```json
{
  "message": "Do you provide promoters for retail stores?",
  "history": [
    { "role": "user", "content": "I need field manpower." },
    { "role": "assistant", "content": "Which type of manpower do you need?" }
  ],
  "currentPage": "/promoter-solutions"
}
```

Example success shape:

```json
{
  "success": true,
  "message": "Chatbot response generated.",
  "data": {
    "answer": "...",
    "grounded": true,
    "sources": [
      { "title": "Promoters Services", "url": "/promoter-solutions", "category": "services" }
    ]
  }
}
```

## Runtime flow

1. Validate the public message/history/current page.
2. Build a retrieval query, using the latest user turn only for ambiguous follow-ups.
3. Search the local repository knowledge index.
4. Format the top knowledge chunks into a bounded, source-labelled context.
5. Send system instructions + recent history + current user message to Groq `/openai/v1/chat/completions`.
6. Return only the generated answer and public source metadata.

The Groq request is stateless and the application keeps conversation history itself. The application does not expose model reasoning, hidden prompts or the raw RAG context to the client.

## Required environment

The feature is off by default. To enable it:

```env
CHATBOT_ENABLED=true
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
```

`GROQ_REASONING_EFFORT` is optional and intentionally blank by default because support varies by model. `CHATBOT_ENABLED=true` without `GROQ_API_KEY` fails environment validation.

## Safety boundaries

The public chatbot cannot use private `/admin`, `/business`, `/worker` or employee-joining routes as page context. It has no tool or database access for private account records. The system prompt treats retrieved Markdown as reference material rather than executable instructions and requires ZOBHUNGER-specific factual claims to be grounded in retrieved public knowledge.
