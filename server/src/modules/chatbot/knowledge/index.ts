export { DEFAULT_KNOWLEDGE_ROOT, loadKnowledgeBase } from "./knowledge-loader.js";
export { parseKnowledgeMarkdown, KnowledgeParseError } from "./knowledge-parser.js";
export { knowledgeMetadataSchema } from "./knowledge.schema.js";
export { validateKnowledgeBase } from "./knowledge-validator.js";
export { KNOWLEDGE_CATEGORIES } from "./knowledge.types.js";
export type {
  KnowledgeCategory,
  KnowledgeDocument,
  KnowledgeMetadata,
  KnowledgeStatus,
  KnowledgeValidationIssue,
  KnowledgeValidationResult,
} from "./knowledge.types.js";
export * from "./knowledge-coverage.js";
