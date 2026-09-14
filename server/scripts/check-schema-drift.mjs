import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const serverRoot = fileURLToPath(new URL("../", import.meta.url));
const expectedIndexName = "ChatbotKnowledgeEmbedding_embedding_hnsw_idx";
const expectedDrift = [
  "[*] Changed the `ChatbotKnowledgeEmbedding` table",
  "[-] Removed index on columns (embedding)",
];

function fail(message, details = "") {
  console.error(message);
  if (details.trim()) console.error(details.trim());
  process.exitCode = 2;
}

async function verifyExpectedHnswIndex() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for the schema drift check.");

  const client = new Client({ connectionString });
  await client.connect();
  try {
    const extension = await client.query("SELECT 1 FROM pg_extension WHERE extname = 'vector' LIMIT 1");
    if (extension.rowCount !== 1) throw new Error('The required PostgreSQL extension "vector" is not installed.');

    const index = await client.query(
      `SELECT indexdef
         FROM pg_indexes
        WHERE schemaname = current_schema()
          AND tablename = 'ChatbotKnowledgeEmbedding'
          AND indexname = $1`,
      [expectedIndexName],
    );
    if (index.rowCount !== 1) throw new Error(`Expected pgvector HNSW index ${expectedIndexName} was not found.`);

    const definition = String(index.rows[0]?.indexdef ?? "");
    if (!/USING\s+hnsw\s*\(\s*"?embedding"?\s+vector_cosine_ops\s*\)/i.test(definition)) {
      throw new Error(`Index ${expectedIndexName} exists but is not the expected HNSW cosine index.`);
    }
  } finally {
    await client.end();
  }
}

const prisma = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));
const diff = spawnSync(
  process.execPath,
  [prisma, "migrate", "diff", "--from-config-datasource", "--to-schema", "prisma/schema.prisma", "--exit-code"],
  { cwd: serverRoot, env: process.env, encoding: "utf8" },
);

if (diff.error) {
  fail("Could not run Prisma schema drift check.", diff.error.message);
} else if (diff.status === 0) {
  if (diff.stdout) process.stdout.write(diff.stdout);
  if (diff.stderr) process.stderr.write(diff.stderr);
  console.log("Database schema matches the Prisma schema.");
} else if (diff.status === 2) {
  const combined = `${diff.stdout ?? ""}\n${diff.stderr ?? ""}`;
  const driftLines = combined
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\[(?:\*|\+|-)\]/.test(line));

  const onlyExpectedPrismaGap = driftLines.length === expectedDrift.length
    && driftLines.every((line, index) => line === expectedDrift[index]);

  if (!onlyExpectedPrismaGap) {
    fail("Unexpected database/schema drift detected.", combined);
  } else {
    try {
      await verifyExpectedHnswIndex();
      console.log(`Schema drift check passed. Prisma cannot represent the intentional pgvector HNSW index ${expectedIndexName}; the live index definition was verified directly.`);
    } catch (error) {
      fail("The Prisma drift matched the pgvector exception, but the database index verification failed.", error instanceof Error ? error.message : String(error));
    }
  }
} else {
  fail(`Prisma schema drift command failed with exit code ${diff.status ?? "unknown"}.`, `${diff.stdout ?? ""}\n${diff.stderr ?? ""}`);
}
