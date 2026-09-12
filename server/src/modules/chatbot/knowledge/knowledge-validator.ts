import path from "node:path";
import { loadKnowledgeBase, type LoadKnowledgeBaseOptions } from "./knowledge-loader.js";
import { KNOWLEDGE_CATEGORIES } from "./knowledge.types.js";
import type {
  KnowledgeDocument,
  KnowledgeValidationIssue,
  KnowledgeValidationResult,
} from "./knowledge.types.js";

const MIN_BODY_LENGTH = 80;

function addIssue(
  issues: KnowledgeValidationIssue[],
  issue: KnowledgeValidationIssue,
) {
  issues.push(issue);
}

function validateDocument(document: KnowledgeDocument, issues: KnowledgeValidationIssue[]) {
  const { metadata, body, relativePath } = document;
  const normalizedRelativePath = relativePath.split(path.sep).join("/");
  const topDirectory = normalizedRelativePath.split("/")[0];

  if (!topDirectory || !KNOWLEDGE_CATEGORIES.includes(topDirectory as (typeof KNOWLEDGE_CATEGORIES)[number])) {
    addIssue(issues, {
      severity: "error",
      code: "INVALID_CATEGORY_FOLDER",
      file: relativePath,
      message: `knowledge document must live inside one of: ${KNOWLEDGE_CATEGORIES.join(", ")}`,
    });
  } else if (topDirectory !== metadata.category) {
    addIssue(issues, {
      severity: "error",
      code: "CATEGORY_PATH_MISMATCH",
      file: relativePath,
      message: `metadata category '${metadata.category}' does not match folder '${topDirectory}'`,
    });
  }

  if (body.length < MIN_BODY_LENGTH) {
    addIssue(issues, {
      severity: metadata.status === "published" ? "error" : "warning",
      code: "BODY_TOO_SHORT",
      file: relativePath,
      message: `knowledge body is ${body.length} characters; expected at least ${MIN_BODY_LENGTH}`,
    });
  }

  const firstHeading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (!firstHeading) {
    addIssue(issues, {
      severity: "warning",
      code: "MISSING_H1",
      file: relativePath,
      message: "knowledge document should contain a level-one heading",
    });
  } else if (firstHeading.toLowerCase() !== metadata.title.toLowerCase()) {
    addIssue(issues, {
      severity: "warning",
      code: "TITLE_H1_MISMATCH",
      file: relativePath,
      message: `H1 '${firstHeading}' differs from metadata title '${metadata.title}'`,
    });
  }

  const duplicateKeywords = metadata.keywords.filter(
    (keyword, index, all) =>
      all.findIndex((candidate) => candidate.toLowerCase() === keyword.toLowerCase()) !== index,
  );
  if (duplicateKeywords.length > 0) {
    addIssue(issues, {
      severity: "warning",
      code: "DUPLICATE_KEYWORDS",
      file: relativePath,
      message: `duplicate keywords: ${[...new Set(duplicateKeywords)].join(", ")}`,
    });
  }
}

function validateDuplicates(documents: KnowledgeDocument[], issues: KnowledgeValidationIssue[]) {
  const byId = new Map<string, KnowledgeDocument[]>();
  const byUrl = new Map<string, KnowledgeDocument[]>();

  for (const document of documents) {
    const idMatches = byId.get(document.metadata.id) ?? [];
    idMatches.push(document);
    byId.set(document.metadata.id, idMatches);

    if (document.metadata.status === "published") {
      const urlMatches = byUrl.get(document.metadata.url) ?? [];
      urlMatches.push(document);
      byUrl.set(document.metadata.url, urlMatches);
    }
  }

  for (const [id, matches] of byId) {
    if (matches.length <= 1) continue;
    for (const match of matches) {
      addIssue(issues, {
        severity: "error",
        code: "DUPLICATE_ID",
        file: match.relativePath,
        message: `knowledge id '${id}' is used by ${matches.length} documents`,
      });
    }
  }

  for (const [url, matches] of byUrl) {
    if (matches.length <= 1) continue;
    for (const match of matches) {
      addIssue(issues, {
        severity: "warning",
        code: "DUPLICATE_PUBLISHED_URL",
        file: match.relativePath,
        message: `published URL '${url}' is shared by ${matches.length} documents; confirm this is intentional`,
      });
    }
  }
}

export async function validateKnowledgeBase(
  options: LoadKnowledgeBaseOptions = {},
): Promise<KnowledgeValidationResult> {
  const loaded = await loadKnowledgeBase({
    ...options,
    includeDrafts: true,
    includeArchived: true,
  });
  const issues = [...loaded.issues];

  for (const document of loaded.documents) validateDocument(document, issues);
  validateDuplicates(loaded.documents, issues);

  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;

  return {
    valid: errorCount === 0,
    documents: loaded.documents,
    issues,
    errorCount,
    warningCount,
  };
}
