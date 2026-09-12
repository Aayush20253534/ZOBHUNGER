const RETIRED_GROQ_MODELS = new Map<string, string>([
  ["llama-3.3-70b-versatile", "retired for Groq Free/Developer usage; use openai/gpt-oss-120b or another currently supported production model"],
]);

export function retiredGroqModelReason(model: string): string | null {
  return RETIRED_GROQ_MODELS.get(model.trim().toLowerCase()) ?? null;
}

export function assertSupportedGroqModel(model: string, label = "GROQ_MODEL") {
  const reason = retiredGroqModelReason(model);
  if (reason) throw new Error(`${label}=${model} is not release-safe: ${reason}`);
}

export function validateGroqModelPair(primary: string, fallback?: string | null): string[] {
  const problems: string[] = [];
  const primaryReason = retiredGroqModelReason(primary);
  if (primaryReason) problems.push(`GROQ_MODEL=${primary} is not release-safe: ${primaryReason}`);
  if (fallback) {
    const fallbackReason = retiredGroqModelReason(fallback);
    if (fallbackReason) problems.push(`GROQ_FALLBACK_MODEL=${fallback} is not release-safe: ${fallbackReason}`);
    if (fallback === primary) problems.push("GROQ_FALLBACK_MODEL must differ from GROQ_MODEL");
  }
  return problems;
}
