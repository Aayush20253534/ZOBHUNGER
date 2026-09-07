import { prisma } from "../../config/db.js";
import type { CreatePartnerApplicationInput } from "./partners.schema.js";

export function createPartnerApplication(
  data: CreatePartnerApplicationInput & { resumeUploadToken: string },
) {
  return prisma.partnerApplication.create({
    data,
    select: {
      id: true,
      fullName: true,
      email: true,
      createdAt: true,
      resumeUploadToken: true,
    },
  });
}

export function findPartnerApplicationUploadTarget(id: string, uploadToken: string) {
  return prisma.partnerApplication.findFirst({
    where: { id, resumeUploadToken: uploadToken },
    select: { id: true },
  });
}

export function savePartnerResume(
  id: string,
  file: { fileName: string; mimeType: string; data: Uint8Array },
) {
  return prisma.partnerApplication.update({
    where: { id },
    data: {
      resumeFileName: file.fileName,
      resumeMimeType: file.mimeType,
      resumeData: new Uint8Array(file.data),
      resumeUploadToken: null,
    },
    select: { id: true, resumeFileName: true },
  });
}
