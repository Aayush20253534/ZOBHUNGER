import { prisma } from "../../../config/db.js";
import { logger } from "../../../utils/logger.js";
import { knowledgeMetadataSchema } from "./knowledge.schema.js";
import type { KnowledgeDocument } from "./knowledge.types.js";

export async function loadPublishedManagedKnowledge(): Promise<KnowledgeDocument[]> {
  try {
    const now = new Date();
    const rows = await prisma.chatbotKnowledgeDocument.findMany({
      where: {
        status: "PUBLISHED",
        verifiedAt: { not: null },
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
          { OR: [{ reviewDueAt: null }, { reviewDueAt: { gte: now } }] },
        ],
      },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    });

    return rows.flatMap((row) => {
      const parsed = knowledgeMetadataSchema.safeParse({
        id: `managed-${row.slug}`,
        title: row.title,
        category: row.category,
        url: row.url,
        keywords: row.keywords,
        aliases: row.aliases,
        description: row.description ?? undefined,
        status: "published",
        updatedAt: row.updatedAt.toISOString().slice(0, 10),
      });
      if (!parsed.success || !row.body.trim()) {
        logger.warn("chatbot.knowledge.managed_invalid", {
          knowledgeId: row.id, slug: row.slug,
          issues: parsed.success ? ["body is empty"] : parsed.error.issues.map((issue) => issue.message).slice(0, 8),
        });
        return [];
      }
      return [{
        metadata: parsed.data,
        body: row.body.trim(),
        absolutePath: "",
        relativePath: `managed/${row.slug}.md`,
      } satisfies KnowledgeDocument];
    });
  } catch (error) {
    logger.warn("chatbot.knowledge.managed_load_failed", { error: error instanceof Error ? error.message.slice(0, 240) : "unknown" });
    return [];
  }
}
