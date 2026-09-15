import { prisma } from "../../config/db.js";
import type { CreateTechnicalInstituteApplicationInput } from "./technical-institutes.schema.js";

export function createTechnicalInstituteApplication(data: CreateTechnicalInstituteApplicationInput) {
  return prisma.technicalInstituteApplication.create({
    data,
    select: {
      id: true,
      institutionName: true,
      officialEmail: true,
      status: true,
      createdAt: true,
    },
  });
}
