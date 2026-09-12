import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { KnowledgeDocument } from "./knowledge.types.js";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(MODULE_DIR, "../../../../..");

export interface KnowledgeCoverageReport {
  expectedRoutes: string[];
  coveredRoutes: string[];
  missingRoutes: string[];
  aggregateRoutes: string[];
  orphanKnowledgeRoutes: string[];
}

export interface EvaluateKnowledgeCoverageOptions {
  repositoryRoot?: string;
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function extractQuotedValues(source: string, field: "path" | "slug"): string[] {
  const expression = new RegExp(`${field}\\s*:\\s*["']([^"']*)["']`, "g");
  return [...source.matchAll(expression)].map((match) => match[1] ?? "");
}

async function readRouteCatalog(repositoryRoot: string) {
  const clientRoot = path.join(repositoryRoot, "client", "src");
  const [sitemapSource, solutionsSource, industriesSource, caseStudiesSource] = await Promise.all([
    readFile(path.join(clientRoot, "app", "sitemap.ts"), "utf8"),
    readFile(path.join(clientRoot, "data", "solutions.ts"), "utf8"),
    readFile(path.join(clientRoot, "data", "industries.ts"), "utf8"),
    readFile(path.join(clientRoot, "data", "case-studies.ts"), "utf8"),
  ]);

  const staticRoutes = extractQuotedValues(sitemapSource, "path").map((route) => route || "/");
  const solutionRoutes = extractQuotedValues(solutionsSource, "slug").filter(Boolean).map((slug) => `/${slug}`);
  const industryRoutes = extractQuotedValues(industriesSource, "slug").filter(Boolean).map((slug) => `/industries/${slug}`);
  const caseStudyRoutes = extractQuotedValues(caseStudiesSource, "slug").filter(Boolean).map((slug) => `/case-studies/${slug}`);

  return {
    expectedRoutes: uniqueSorted([
      ...staticRoutes,
      ...solutionRoutes,
      ...industryRoutes,
      ...caseStudyRoutes,
    ]),
    aggregateChildren: new Map<string, string[]>([
      ["/solutions", solutionRoutes],
      ["/industries", industryRoutes],
      ["/case-studies", caseStudyRoutes],
    ]),
  };
}

export async function evaluateKnowledgeCoverage(
  documents: readonly KnowledgeDocument[],
  options: EvaluateKnowledgeCoverageOptions = {},
): Promise<KnowledgeCoverageReport> {
  const repositoryRoot = path.resolve(options.repositoryRoot ?? REPOSITORY_ROOT);
  const { expectedRoutes, aggregateChildren } = await readRouteCatalog(repositoryRoot);

  const publishedRoutes = new Set(
    documents
      .filter((document) => document.metadata.status === "published")
      .map((document) => document.metadata.url),
  );

  const aggregateRoutes: string[] = [];
  const covered = new Set<string>();

  for (const route of expectedRoutes) {
    if (publishedRoutes.has(route)) {
      covered.add(route);
      continue;
    }

    const children = aggregateChildren.get(route);
    if (children?.length && children.every((child) => publishedRoutes.has(child))) {
      covered.add(route);
      aggregateRoutes.push(route);
    }
  }

  return {
    expectedRoutes,
    coveredRoutes: uniqueSorted(covered),
    missingRoutes: expectedRoutes.filter((route) => !covered.has(route)),
    aggregateRoutes: uniqueSorted(aggregateRoutes),
    orphanKnowledgeRoutes: uniqueSorted(
      [...publishedRoutes].filter((route) => !expectedRoutes.includes(route)),
    ),
  };
}
