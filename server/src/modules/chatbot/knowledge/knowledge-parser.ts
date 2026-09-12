import { knowledgeMetadataSchema } from "./knowledge.schema.js";
import type { KnowledgeDocument, KnowledgeMetadata } from "./knowledge.types.js";

const FRONTMATTER_BOUNDARY = "---";
const LIST_FIELDS = new Set(["keywords", "aliases"]);

export class KnowledgeParseError extends Error {
  constructor(
    message: string,
    public readonly file?: string,
  ) {
    super(file ? `${file}: ${message}` : message);
    this.name = "KnowledgeParseError";
  }
}

function stripWrappingQuotes(value: string) {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseInlineList(value: string): string[] | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) return [];
  return inner
    .split(",")
    .map((item) => stripWrappingQuotes(item))
    .filter(Boolean);
}

function parseFrontmatter(frontmatter: string, file?: string): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};
  const lines = frontmatter.split(/\r?\n/);
  let activeListKey: string | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? "";
    const lineNumber = index + 2;
    if (!rawLine.trim() || rawLine.trimStart().startsWith("#")) continue;

    const listItem = rawLine.match(/^\s+-\s+(.+)$/);
    if (listItem) {
      if (!activeListKey) {
        throw new KnowledgeParseError(
          `unexpected list item at frontmatter line ${lineNumber}`,
          file,
        );
      }
      const current = metadata[activeListKey];
      if (!Array.isArray(current)) {
        throw new KnowledgeParseError(
          `frontmatter field ${activeListKey} is not a list`,
          file,
        );
      }
      current.push(stripWrappingQuotes(listItem[1] ?? ""));
      continue;
    }

    const match = rawLine.match(/^([A-Za-z][A-Za-z0-9_-]*):(?:\s*(.*))?$/);
    if (!match) {
      throw new KnowledgeParseError(
        `invalid frontmatter syntax at line ${lineNumber}`,
        file,
      );
    }

    const [, key, rawValue = ""] = match;
    const value = rawValue.trim();
    activeListKey = null;

    if (LIST_FIELDS.has(key)) {
      const inlineList = parseInlineList(value);
      if (inlineList) {
        metadata[key] = inlineList;
      } else if (!value) {
        metadata[key] = [];
        activeListKey = key;
      } else {
        throw new KnowledgeParseError(
          `${key} must be an inline list [a, b] or a YAML-style list`,
          file,
        );
      }
      continue;
    }

    metadata[key] = stripWrappingQuotes(value);
  }

  return metadata;
}

export function parseKnowledgeMarkdown(
  source: string,
  options: { absolutePath?: string; relativePath?: string } = {},
): KnowledgeDocument {
  const normalized = source.replace(/^\uFEFF/, "");
  const lines = normalized.split(/\r?\n/);

  if (lines[0]?.trim() !== FRONTMATTER_BOUNDARY) {
    throw new KnowledgeParseError("knowledge file must start with --- frontmatter", options.relativePath);
  }

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === FRONTMATTER_BOUNDARY,
  );

  if (closingIndex === -1) {
    throw new KnowledgeParseError("knowledge frontmatter is missing its closing ---", options.relativePath);
  }

  const frontmatter = lines.slice(1, closingIndex).join("\n");
  const body = lines.slice(closingIndex + 1).join("\n").trim();
  const parsedMetadata = parseFrontmatter(frontmatter, options.relativePath);
  const schemaResult = knowledgeMetadataSchema.safeParse(parsedMetadata);

  if (!schemaResult.success) {
    const details = schemaResult.error.issues
      .map((issue: { path: PropertyKey[]; message: string }) => `${issue.path.join(".") || "metadata"}: ${issue.message}`)
      .join("; ");
    throw new KnowledgeParseError(`invalid metadata: ${details}`, options.relativePath);
  }

  return {
    metadata: schemaResult.data as KnowledgeMetadata,
    body,
    absolutePath: options.absolutePath ?? "",
    relativePath: options.relativePath ?? "",
  };
}
