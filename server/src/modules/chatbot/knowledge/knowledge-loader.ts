import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseKnowledgeMarkdown } from "./knowledge-parser.js";
import type { KnowledgeDocument, KnowledgeValidationIssue } from "./knowledge.types.js";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_KNOWLEDGE_ROOT = path.resolve(MODULE_DIR);

const IGNORED_DIRECTORY_NAMES = new Set(["runtime", "_templates"]);
const IGNORED_FILE_NAMES = new Set(["README.md"]);

async function findMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORY_NAMES.has(entry.name)) continue;
      files.push(...(await findMarkdownFiles(fullPath)));
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith(".md") &&
      !IGNORED_FILE_NAMES.has(entry.name)
    ) {
      files.push(fullPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

export interface LoadKnowledgeBaseOptions {
  rootDir?: string;
  includeDrafts?: boolean;
  includeArchived?: boolean;
}

export interface LoadKnowledgeBaseResult {
  documents: KnowledgeDocument[];
  issues: KnowledgeValidationIssue[];
}

export async function loadKnowledgeBase(
  options: LoadKnowledgeBaseOptions = {},
): Promise<LoadKnowledgeBaseResult> {
  const rootDir = path.resolve(options.rootDir ?? DEFAULT_KNOWLEDGE_ROOT);
  const files = await findMarkdownFiles(rootDir);
  const documents: KnowledgeDocument[] = [];
  const issues: KnowledgeValidationIssue[] = [];

  for (const absolutePath of files) {
    const relativePath = path.relative(rootDir, absolutePath).split(path.sep).join("/");
    try {
      const source = await readFile(absolutePath, "utf8");
      const document = parseKnowledgeMarkdown(source, { absolutePath, relativePath });

      if (document.metadata.status === "draft" && !options.includeDrafts) continue;
      if (document.metadata.status === "archived" && !options.includeArchived) continue;

      documents.push(document);
    } catch (error) {
      issues.push({
        severity: "error",
        code: "KNOWLEDGE_PARSE_ERROR",
        message: error instanceof Error ? error.message : "Unknown knowledge parsing error",
        file: relativePath,
      });
    }
  }

  return { documents, issues };
}
