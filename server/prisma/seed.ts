import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, JobStatus, UserRole } from "../src/generated/prisma/client.js";
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

const demoJobs = [
  {
    slug: "field-sales-executive-lucknow",
    title: "Field Sales Executive",
    location: "Lucknow, Uttar Pradesh",
    city: "Lucknow",
    state: "Uttar Pradesh",
    category: "Sales",
    engagementType: "Full-time",
    description: "Represent a growing consumer brand in the field, build retailer relationships and achieve assigned sales targets.",
    responsibilities: [
      "Visit assigned outlets and prospects",
      "Generate and follow up on sales leads",
      "Maintain daily field activity updates",
    ],
    requirements: [
      "Clear communication skills",
      "Comfortable with local field travel",
      "Sales experience is helpful but not mandatory",
    ],
    compensation: "₹18,000–₹25,000 per month + incentives",
  },
  {
    slug: "brand-promoter-delhi-ncr",
    title: "Brand Promoter",
    location: "Delhi NCR",
    city: "Delhi",
    state: "Delhi",
    category: "Promoter",
    engagementType: "Campaign-based",
    description: "Support in-store and activation campaigns by demonstrating products and engaging customers for a leading consumer brand.",
    responsibilities: [
      "Explain product benefits to customers",
      "Support demonstrations and sampling",
      "Capture basic campaign activity data",
    ],
    requirements: [
      "Confident customer-facing communication",
      "Professional presentation",
      "Availability during campaign dates",
    ],
    compensation: "₹900–₹1,400 per day",
  },
  {
    slug: "retail-merchandiser-noida",
    title: "Retail Merchandiser",
    location: "Noida, Uttar Pradesh",
    city: "Noida",
    state: "Uttar Pradesh",
    category: "Retail Execution",
    engagementType: "Full-time",
    description: "Execute merchandising standards across assigned retail stores and report product availability, visibility and shelf compliance.",
    responsibilities: [
      "Visit assigned retail stores",
      "Maintain shelf and display standards",
      "Report stock and visibility observations",
    ],
    requirements: [
      "Comfortable travelling between stores",
      "Basic smartphone proficiency",
      "Retail experience is preferred",
    ],
    compensation: "₹17,000–₹22,000 per month",
  },
  {
    slug: "telecaller-prayagraj",
    title: "Telecaller",
    location: "Prayagraj, Uttar Pradesh",
    city: "Prayagraj",
    state: "Uttar Pradesh",
    category: "Telecalling",
    engagementType: "Full-time",
    description: "Handle outbound prospect calls, qualify leads and maintain accurate follow-up information for the sales team.",
    responsibilities: [
      "Make outbound calls from assigned lead lists",
      "Record outcomes and follow-up dates",
      "Share qualified leads with the sales team",
    ],
    requirements: [
      "Hindi communication is required",
      "Basic English is useful",
      "Comfortable working with call targets",
    ],
    compensation: "₹14,000–₹20,000 per month + incentives",
  },
  {
    slug: "field-executive-jaipur",
    title: "Field Executive",
    location: "Jaipur, Rajasthan",
    city: "Jaipur",
    state: "Rajasthan",
    category: "Field Work",
    engagementType: "Project-based",
    description: "Support an on-ground market execution project involving outlet visits, data collection and verification across Jaipur.",
    responsibilities: [
      "Complete assigned outlet visits",
      "Collect and verify field information",
      "Submit accurate daily task updates",
    ],
    requirements: [
      "Android smartphone",
      "Local travel capability",
      "Strong attention to detail",
    ],
    compensation: "Project-based payout",
  },
];

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

  for (const job of demoJobs) {
    await prisma.job.upsert({
      where: { slug: job.slug },
      update: {
        ...job,
        status: JobStatus.OPEN,
        createdByUserId: admin.id,
        publishedAt: new Date(),
      },
      create: {
        ...job,
        status: JobStatus.OPEN,
        createdByUserId: admin.id,
        publishedAt: new Date(),
      },
    });
  }

  console.log(`Seeded admin ${admin.email} and ${demoJobs.length} demo jobs.`);
}

seed()
  .catch((error) => {
    console.error("Database seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
