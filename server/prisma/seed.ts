import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, JobStatus, Prisma, UserRole } from "../src/generated/prisma/client.js";
import { seedArticles } from "./seed-articles.js";
import { seedJobs } from "./seed-jobs.js";
import { z } from "zod";

const seedEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ADMIN_SEED_EMAIL: z.string().email().transform((value) => value.toLowerCase()),
  ADMIN_SEED_PASSWORD_HASH: z
    .string()
    .startsWith("$argon2id$", "ADMIN_SEED_PASSWORD_HASH must be an Argon2id hash"),
});

const seedEnv = seedEnvSchema.parse(process.env);

const adapter = new PrismaPg({ connectionString: seedEnv.DATABASE_URL });
const prisma = new PrismaClient({ adapter });


async function seed(): Promise<void> {
  const admin = await prisma.user.upsert({
    where: { email: seedEnv.ADMIN_SEED_EMAIL },
    update: {
      passwordHash: seedEnv.ADMIN_SEED_PASSWORD_HASH,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      email: seedEnv.ADMIN_SEED_EMAIL,
      passwordHash: seedEnv.ADMIN_SEED_PASSWORD_HASH,
      role: UserRole.ADMIN,
      isActive: true,
    },
    select: { id: true, email: true },
  });

  for (const job of seedJobs) {
    const publishedAt = new Date(job.createdAt);
    const data = {
      slug: job.slug,
      title: job.title,
      location: job.location,
      city: job.location,
      category: job.category,
      engagementType: job.engagementType,
      description: job.description,
      responsibilities: [...job.responsibilities],
      requirements: [...job.requirements],
      isDemo: job.isDemo,
      status: JobStatus.OPEN,
      createdByUserId: admin.id,
      publishedAt,
    };

    await prisma.job.upsert({
      where: { slug: job.slug },
      update: data,
      create: { ...data, createdAt: publishedAt },
    });
  }

  for (const article of seedArticles) {
    const data = {
      title: article.title,
      excerpt: article.excerpt,
      category: article.category,
      readingMinutes: article.readingMinutes,
      takeaway: article.takeaway,
      sections: article.sections as unknown as Prisma.InputJsonValue,
      isPublished: article.isPublished,
      isSample: article.isSample,
      publishedAt: article.isPublished ? new Date() : null,
    };

    await prisma.article.upsert({
      where: { slug: article.slug },
      update: data,
      create: { slug: article.slug, ...data },
    });
  }

  console.log(
    `Seeded admin ${admin.email}, ${seedJobs.length} jobs and ${seedArticles.length} articles.`,
  );
}

seed()
  .catch((error) => {
    console.error("Database seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
