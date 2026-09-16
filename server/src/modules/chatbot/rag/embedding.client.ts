import { env } from "../../../config/env.js";
import { consumeProviderBudget } from "../../../operations/provider-budget.js";
import { guardedProviderRequest } from "../../../operations/provider-circuit.js";

export interface EmbeddingClientConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

export interface EmbeddingDocumentInput {
  text: string;
  title?: string;
}

export interface EmbeddingClient {
  model: string;
  dimensions: 1536;
  embedDocuments(inputs: EmbeddingDocumentInput[]): Promise<number[][]>;
  embedQueries(inputs: string[]): Promise<number[][]>;
}

type EmbeddingPurpose = "document" | "query";

const EMBEDDING_DIMENSIONS = 1536 as const;

function cleanBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function cleanModel(value: string) {
  return value.replace(/^models\//, "");
}

function isGeminiEmbedding2(model: string) {
  return cleanModel(model).startsWith("gemini-embedding-2");
}

function prepareEmbedding2Text(purpose: EmbeddingPurpose, input: EmbeddingDocumentInput) {
  if (purpose === "query") {
    return `task: search result | query: ${input.text}`;
  }
  return `title: ${input.title?.trim() || "none"} | text: ${input.text}`;
}

function normalizeVector(vector: number[]) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!Number.isFinite(magnitude) || magnitude <= 0) {
    throw new Error("Gemini embedding API returned a zero or invalid vector");
  }
  return vector.map((value) => value / magnitude);
}

function validateVector(value: unknown) {
  if (!Array.isArray(value) || value.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Gemini embedding API must return ${EMBEDDING_DIMENSIONS}-dimensional vectors`);
  }
  if (value.some((item) => typeof item !== "number" || !Number.isFinite(item))) {
    throw new Error("Gemini embedding API returned an invalid vector");
  }
  return normalizeVector(value as number[]);
}

export function createGeminiEmbeddingClient(config: EmbeddingClientConfig): EmbeddingClient {
  const model = cleanModel(config.model);
  const modelResource = `models/${model}`;

  async function embed(inputs: EmbeddingDocumentInput[], purpose: EmbeddingPurpose): Promise<number[][]> {
    if (!inputs.length) return [];

    await consumeProviderBudget("gemini", "requests", 1, env.GEMINI_DAILY_REQUEST_LIMIT);
    await consumeProviderBudget("gemini", "input_chars", inputs.reduce((sum, input) => sum + input.text.length + (input.title?.length ?? 0), 0), env.GEMINI_DAILY_INPUT_CHAR_LIMIT);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    const embedding2 = isGeminiEmbedding2(model);

    try {
      const response = await guardedProviderRequest("gemini", () => fetch(`${cleanBaseUrl(config.baseUrl)}/${modelResource}:batchEmbedContents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": config.apiKey,
        },
        body: JSON.stringify({
          requests: inputs.map((input) => {
            const text = embedding2 ? prepareEmbedding2Text(purpose, input) : input.text;
            const embedContentConfig = {
              outputDimensionality: EMBEDDING_DIMENSIONS,
              autoTruncate: true,
              ...(!embedding2
                ? {
                    taskType: purpose === "document" ? "RETRIEVAL_DOCUMENT" : "RETRIEVAL_QUERY",
                    ...(purpose === "document" && input.title?.trim() ? { title: input.title.trim() } : {}),
                  }
                : {}),
            };

            return {
              model: modelResource,
              content: { parts: [{ text }] },
              embedContentConfig,
            };
          }),
        }),
        signal: controller.signal,
      }));

      if (!response.ok) {
        const text = (await response.text()).slice(0, 500);
        throw new Error(`Gemini embedding API returned ${response.status}: ${text}`);
      }

      const body = await response.json() as {
        embeddings?: Array<{ values?: unknown }>;
      };
      const embeddings = body.embeddings ?? [];
      if (embeddings.length !== inputs.length) {
        throw new Error("Gemini embedding API returned an unexpected vector count");
      }
      return embeddings.map((item) => validateVector(item.values));
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    model,
    dimensions: EMBEDDING_DIMENSIONS,
    embedDocuments(inputs) {
      return embed(inputs, "document");
    },
    embedQueries(inputs) {
      return embed(inputs.map((text) => ({ text })), "query");
    },
  };
}
