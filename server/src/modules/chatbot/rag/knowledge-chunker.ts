import type { KnowledgeDocument } from "../knowledge/knowledge.types.js";
import type { ChunkKnowledgeOptions, KnowledgeChunk } from "./rag.types.js";

const DEFAULT_TARGET_CHARS = 2200;
const DEFAULT_MAX_CHARS = 3200;
const DEFAULT_OVERLAP_CHARS = 260;

interface MarkdownSection {
  heading: string;
  sectionPath: string[];
  body: string;
}

function cleanHeading(value: string) {
  return value.replace(/[*_`]/g, "").trim();
}

function splitIntoSections(document: KnowledgeDocument): MarkdownSection[] {
  const lines = document.body.split(/\r?\n/);
  const sections: MarkdownSection[] = [];
  let h1 = document.metadata.title;
  let currentHeading = "Overview";
  let currentLines: string[] = [];

  const flush = () => {
    const body = currentLines.join("\n").trim();
    if (!body) return;
    sections.push({
      heading: currentHeading,
      sectionPath: currentHeading === "Overview" ? [h1] : [h1, currentHeading],
      body,
    });
    currentLines = [];
  };

  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match) {
      h1 = cleanHeading(h1Match[1] ?? document.metadata.title);
      continue;
    }

    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      flush();
      currentHeading = cleanHeading(h2Match[1] ?? "Overview");
      continue;
    }

    currentLines.push(line);
  }

  flush();

  if (sections.length === 0 && document.body.trim()) {
    sections.push({
      heading: "Overview",
      sectionPath: [h1],
      body: document.body.trim(),
    });
  }

  return sections;
}

function splitOversizedBlock(block: string, maxChars: number): string[] {
  if (block.length <= maxChars) return [block];

  const sentences = block
    .split(/(?<=[.!?])\s+(?=[A-Z0-9*])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length <= 1) {
    const words = block.split(/\s+/);
    const pieces: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > maxChars && current) {
        pieces.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) pieces.push(current);
    return pieces;
  }

  const pieces: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > maxChars && current) {
      pieces.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current) pieces.push(current);
  return pieces.flatMap((piece) => (piece.length > maxChars ? splitOversizedBlock(piece, maxChars) : [piece]));
}

function overlapTail(value: string, overlapChars: number): string {
  if (overlapChars <= 0 || value.length <= overlapChars) return value;
  const tail = value.slice(-overlapChars);
  const firstBoundary = tail.search(/[.!?]\s|\n/);
  return (firstBoundary >= 0 ? tail.slice(firstBoundary + 1) : tail).trim();
}

function splitSection(
  section: MarkdownSection,
  options: Required<ChunkKnowledgeOptions>,
): string[] {
  const rawBlocks = section.body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block) => splitOversizedBlock(block, options.maxChars));

  if (rawBlocks.length === 0) return [];

  const chunks: string[] = [];
  let current = "";

  for (const block of rawBlocks) {
    const candidate = current ? `${current}\n\n${block}` : block;
    const shouldFlush =
      current &&
      (candidate.length > options.maxChars ||
        (current.length >= options.targetChars && candidate.length > options.targetChars));

    if (shouldFlush) {
      chunks.push(current.trim());
      const overlap = overlapTail(current, options.overlapChars);
      current = overlap ? `${overlap}\n\n${block}` : block;
      if (current.length > options.maxChars) {
        const pieces = splitOversizedBlock(current, options.maxChars);
        chunks.push(...pieces.slice(0, -1));
        current = pieces.at(-1) ?? "";
      }
    } else {
      current = candidate;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function chunkKnowledgeDocument(
  document: KnowledgeDocument,
  options: ChunkKnowledgeOptions = {},
): KnowledgeChunk[] {
  const resolvedOptions: Required<ChunkKnowledgeOptions> = {
    targetChars: Math.max(600, options.targetChars ?? DEFAULT_TARGET_CHARS),
    maxChars: Math.max(900, options.maxChars ?? DEFAULT_MAX_CHARS),
    overlapChars: Math.max(0, options.overlapChars ?? DEFAULT_OVERLAP_CHARS),
  };

  if (resolvedOptions.maxChars < resolvedOptions.targetChars) {
    resolvedOptions.maxChars = resolvedOptions.targetChars;
  }
  resolvedOptions.overlapChars = Math.min(
    resolvedOptions.overlapChars,
    Math.floor(resolvedOptions.targetChars / 3),
  );

  const sections = splitIntoSections(document);
  const chunks: KnowledgeChunk[] = [];
  let ordinal = 0;

  for (const section of sections) {
    const sectionChunks = splitSection(section, resolvedOptions);
    for (const content of sectionChunks) {
      chunks.push({
        id: `${document.metadata.id}:${ordinal + 1}`,
        documentId: document.metadata.id,
        title: document.metadata.title,
        category: document.metadata.category,
        url: document.metadata.url,
        description: document.metadata.description,
        keywords: [...document.metadata.keywords],
        aliases: [...(document.metadata.aliases ?? [])],
        section: section.heading,
        sectionPath: [...section.sectionPath],
        content,
        sourcePath: document.relativePath,
        estimatedTokens: Math.max(1, Math.ceil(content.length / 4)),
        ordinal,
      });
      ordinal += 1;
    }
  }

  return chunks;
}

export function chunkKnowledgeBase(
  documents: KnowledgeDocument[],
  options: ChunkKnowledgeOptions = {},
): KnowledgeChunk[] {
  return documents.flatMap((document) => chunkKnowledgeDocument(document, options));
}
