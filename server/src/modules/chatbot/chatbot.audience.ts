import { ChatbotAudience } from "../../generated/prisma/client.js";

const JOB_TERMS = /\b(job|jobs|career|careers|worker|candidate|apply|application|vacancy|employment|resume|cv)\b/i;
const BUSINESS_TERMS = /\b(business|company|client|hire|workforce|staffing|requirement|deployment|sales force|promoter|telecaller|retail execution)\b/i;
const VENDOR_TERMS = /\b(vendor|partner|partnership|empanelment|agency|supplier|msme|placement cell|college|institution)\b/i;

export function inferChatbotAudience(message: string, previous: ChatbotAudience = ChatbotAudience.UNKNOWN): ChatbotAudience {
  if (VENDOR_TERMS.test(message)) return ChatbotAudience.VENDOR_PARTNER;
  if (JOB_TERMS.test(message)) return ChatbotAudience.JOB_SEEKER;
  if (BUSINESS_TERMS.test(message)) return ChatbotAudience.BUSINESS;
  return previous === ChatbotAudience.UNKNOWN ? ChatbotAudience.GENERAL : previous;
}

export function audienceActions(audience: ChatbotAudience, unanswered = false) {
  const common = unanswered ? [{ id: "handover", label: "Talk to our team", kind: "handover" as const }] : [];
  switch (audience) {
    case ChatbotAudience.JOB_SEEKER:
      return [
        { id: "jobs", label: "View jobs", kind: "link" as const, href: "/jobs" },
        { id: "career", label: "Submit career profile", kind: "link" as const, href: "/careers" },
        { id: "job-lead", label: "Get help from HR", kind: "lead" as const, audience: "JOB_SEEKER" as const },
        ...common,
      ];
    case ChatbotAudience.BUSINESS:
      return [
        { id: "hire", label: "Hire workforce", kind: "link" as const, href: "/hire-workforce" },
        { id: "business-lead", label: "Share requirement", kind: "lead" as const, audience: "BUSINESS" as const },
        ...common,
      ];
    case ChatbotAudience.VENDOR_PARTNER:
      return [
        { id: "vendor", label: "Vendor empanelment", kind: "link" as const, href: "/vendor-empanelment" },
        { id: "partner", label: "Become a partner", kind: "link" as const, href: "/become-a-partner" },
        { id: "partner-lead", label: "Talk to partnerships", kind: "lead" as const, audience: "VENDOR_PARTNER" as const },
        ...common,
      ];
    default:
      return [
        { id: "contact", label: "Contact ZOBHUNGER", kind: "link" as const, href: "/contact" },
        { id: "general-lead", label: "Leave an enquiry", kind: "lead" as const, audience: "GENERAL" as const },
        ...common,
      ];
  }
}
