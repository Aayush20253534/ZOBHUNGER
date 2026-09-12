import type { KnowledgeSearchResult } from "./rag.types.js";

export interface FormatKnowledgeContextOptions {
  maxCharacters?: number;
}

export function formatKnowledgeContext(
  results: KnowledgeSearchResult[],
  options: FormatKnowledgeContextOptions = {},
): string {
  const maxCharacters = Math.max(1000, options.maxCharacters ?? 14_000);
  const sections: string[] = [];
  let length = 0;

  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    if (!result) continue;
    const block = [
      `[SOURCE ${index + 1}]`,
      `Title: ${result.chunk.title}`,
      `Section: ${result.chunk.sectionPath.join(" > ")}`,
      `Category: ${result.chunk.category}`,
      `URL: ${result.chunk.url}`,
      "Content:",
      result.chunk.content,
    ].join("\n");

    const separatorLength = sections.length > 0 ? 9 : 0;
    const remaining = maxCharacters - length - separatorLength;
    if (remaining <= 0) break;

    if (block.length > remaining) {
      if (sections.length > 0) break;
      const marker = "\n[TRUNCATED]";
      const truncated = `${block.slice(0, Math.max(0, remaining - marker.length)).trimEnd()}${marker}`;
      sections.push(truncated.slice(0, remaining));
      length += Math.min(truncated.length, remaining);
      break;
    }

    sections.push(block);
    length += block.length + separatorLength;
  }

  return sections.join("\n\n---\n\n");
}
