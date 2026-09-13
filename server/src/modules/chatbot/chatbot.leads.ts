import { AdminDepartment, ChatbotAudience, IntakeSourceType } from "../../generated/prisma/client.js";
import { prisma } from "../../config/db.js";
import { notifyChatbotLead } from "../../services/notification.service.js";
import type { ChatbotLeadRequest } from "./chatbot.schema.js";

function departmentFor(audience: ChatbotAudience) {
  return audience === ChatbotAudience.JOB_SEEKER ? AdminDepartment.HR : AdminDepartment.MAIN_ADMIN;
}

export async function submitChatbotLead(input: ChatbotLeadRequest, requestId?: string) {
  const audience = input.audience as ChatbotAudience;
  const conversation = input.conversationId
    ? await prisma.chatbotConversation.findUnique({ where: { publicId: input.conversationId }, select: { id: true } })
    : null;

  const lead = await prisma.$transaction(async (tx) => {
    const created = await tx.chatbotLead.create({ data: {
      conversationId: conversation?.id,
      audience,
      name: input.name,
      email: input.email,
      phone: input.phone,
      companyName: input.companyName,
      requirement: input.requirement,
      enquiryDetails: input.enquiryDetails,
      sourcePath: input.sourcePath,
    } });
    const intake = await tx.intakeCase.create({ data: {
      sourceType: IntakeSourceType.CHATBOT_LEAD,
      sourceId: created.id,
      department: departmentFor(audience),
      subject: `${input.handover ? "Human handover" : "AI assistant lead"}: ${input.requirement.slice(0, 120)}`,
      contactName: input.name,
      contactEmail: input.email,
      contactPhone: input.phone,
      organizationName: input.companyName,
      summary: input.enquiryDetails ?? input.requirement,
      details: {
        audience,
        requirement: input.requirement,
        enquiryDetails: input.enquiryDetails ?? null,
        sourcePath: input.sourcePath ?? null,
        handoverRequested: input.handover,
        conversationPublicId: input.conversationId ?? null,
      },
      submittedAt: new Date(),
      sourceUpdatedAt: new Date(),
    } });
    return tx.chatbotLead.update({ where: { id: created.id }, data: { intakeCaseId: intake.id } });
  });

  void notifyChatbotLead({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    companyName: lead.companyName,
    audience: lead.audience,
    requirement: lead.requirement,
    handover: input.handover,
  }, requestId);

  return {
    id: lead.id,
    status: lead.status,
    message: input.handover
      ? "Your handover request has been sent to the ZOBHUNGER team."
      : "Thanks. Your enquiry has been recorded for the appropriate ZOBHUNGER team.",
  };
}
