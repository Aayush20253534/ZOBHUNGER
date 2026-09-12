import type { ChatbotSource } from "@/lib/chatbot";

export type ChatbotSuggestionIcon =
  | "briefcase"
  | "search"
  | "handshake"
  | "shield"
  | "building"
  | "file"
  | "users"
  | "map"
  | "mail"
  | "sparkles";

export interface ChatbotSuggestion {
  label: string;
  prompt: string;
  icon: ChatbotSuggestionIcon;
}

const DEFAULT_SUGGESTIONS: ChatbotSuggestion[] = [
  { label: "Hire workforce", prompt: "How can I hire workforce through ZOBHUNGER?", icon: "briefcase" },
  { label: "Find work", prompt: "How can I find and apply for jobs through ZOBHUNGER?", icon: "search" },
  { label: "Become a vendor", prompt: "How can my company become an empanelled ZOBHUNGER vendor?", icon: "handshake" },
  { label: "Verification services", prompt: "What verification services does ZOBHUNGER provide?", icon: "shield" },
];

function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function getStarterSuggestions(pathname: string | null | undefined): ChatbotSuggestion[] {
  const path = pathname ?? "/";

  if (startsWithAny(path, ["/for-business", "/hire-workforce", "/become-a-partner"])) {
    return [
      { label: "Hire workforce", prompt: "How can my business hire workforce through ZOBHUNGER?", icon: "briefcase" },
      { label: "Business onboarding", prompt: "How does ZOBHUNGER business onboarding and approval work?", icon: "building" },
      { label: "Supported industries", prompt: "Which industries does ZOBHUNGER support for business workforce requirements?", icon: "users" },
      { label: "Become a partner", prompt: "How can a business become a ZOBHUNGER partner?", icon: "handshake" },
    ];
  }

  if (startsWithAny(path, ["/for-workers", "/jobs", "/careers"])) {
    return [
      { label: "How to apply", prompt: "How can I apply for jobs through ZOBHUNGER?", icon: "file" },
      { label: "Find jobs", prompt: "How can I find available jobs on ZOBHUNGER?", icon: "search" },
      { label: "Worker verification", prompt: "How does worker verification work at ZOBHUNGER?", icon: "shield" },
      { label: "Worker process", prompt: "What is the complete ZOBHUNGER worker registration and approval process?", icon: "users" },
    ];
  }

  if (startsWithAny(path, ["/vendor-empanelment"])) {
    return [
      { label: "Become a vendor", prompt: "How can my company become an empanelled ZOBHUNGER vendor?", icon: "handshake" },
      { label: "Required documents", prompt: "What documents are required for ZOBHUNGER vendor empanelment?", icon: "file" },
      { label: "Vendor review", prompt: "What happens after I submit the vendor empanelment form?", icon: "building" },
      { label: "Project allocation", prompt: "Does ZOBHUNGER vendor empanelment guarantee project allocation?", icon: "briefcase" },
    ];
  }

  if (startsWithAny(path, ["/verification-services"])) {
    return [
      { label: "Verification types", prompt: "What verification services does ZOBHUNGER provide?", icon: "shield" },
      { label: "Request verification", prompt: "How can my business request ZOBHUNGER verification services?", icon: "briefcase" },
      { label: "Field verification", prompt: "Does ZOBHUNGER provide field and on-ground verification?", icon: "map" },
      { label: "Business verification", prompt: "What KYC and business verification services are available?", icon: "building" },
    ];
  }

  if (startsWithAny(path, ["/contact"])) {
    return [
      { label: "Business enquiries", prompt: "Which ZOBHUNGER contact should I use for a business enquiry?", icon: "mail" },
      { label: "Job enquiries", prompt: "How should I contact ZOBHUNGER about jobs and careers?", icon: "users" },
      { label: "Office locations", prompt: "Where are ZOBHUNGER offices located?", icon: "map" },
      { label: "Vendor enquiries", prompt: "How should vendors contact or apply to ZOBHUNGER?", icon: "handshake" },
    ];
  }

  if (startsWithAny(path, ["/solutions", "/workforce-solutions", "/sales-force", "/telecaller-telesales", "/promoter-solutions", "/retail-execution", "/brand-activation", "/business-operations", "/gig-workforce", "/website-application-development"])) {
    return [
      { label: "How it works", prompt: "How does this ZOBHUNGER service work?", icon: "sparkles" },
      { label: "Request this service", prompt: "How can my business request this service from ZOBHUNGER?", icon: "briefcase" },
      { label: "Best-fit industries", prompt: "Which industries commonly use this ZOBHUNGER service?", icon: "building" },
      { label: "Other solutions", prompt: "What other ZOBHUNGER solutions are related to this service?", icon: "users" },
    ];
  }

  if (startsWithAny(path, ["/industries"])) {
    return [
      { label: "Relevant services", prompt: "Which ZOBHUNGER services are most relevant for this industry?", icon: "briefcase" },
      { label: "Workforce support", prompt: "How does ZOBHUNGER support workforce execution in this industry?", icon: "users" },
      { label: "Case studies", prompt: "Does ZOBHUNGER have relevant execution experience or case studies for this industry?", icon: "file" },
      { label: "Hire workforce", prompt: "How can a company in this industry hire workforce through ZOBHUNGER?", icon: "building" },
    ];
  }

  return DEFAULT_SUGGESTIONS;
}

export function getFollowUpSuggestions(input: {
  pathname?: string | null;
  sources?: ChatbotSource[];
  userMessage?: string;
}): ChatbotSuggestion[] {
  const path = input.pathname ?? "/";
  const categories = new Set((input.sources ?? []).map((source) => source.category));
  const lowerMessage = (input.userMessage ?? "").toLowerCase();

  if (path.startsWith("/vendor-empanelment") || categories.has("partnerships") || lowerMessage.includes("vendor")) {
    return [
      { label: "Required documents", prompt: "What documents are required for this vendor or partnership process?", icon: "file" },
      { label: "After submission", prompt: "What happens after the partnership or vendor form is submitted?", icon: "building" },
      { label: "Project allocation", prompt: "Does approval or empanelment guarantee project allocation?", icon: "briefcase" },
    ];
  }

  if (categories.has("jobs") || startsWithAny(path, ["/jobs", "/careers", "/for-workers"])) {
    return [
      { label: "How to apply", prompt: "What are the exact steps to apply for a ZOBHUNGER job?", icon: "file" },
      { label: "Live or demo jobs?", prompt: "How can I tell whether a job shown on the website is a live vacancy or a demo listing?", icon: "search" },
      { label: "Worker verification", prompt: "What verification happens after a worker applies?", icon: "shield" },
    ];
  }

  if (categories.has("services") || path.includes("solutions") || path.includes("services")) {
    return [
      { label: "Request this service", prompt: "How can my business request this service from ZOBHUNGER?", icon: "briefcase" },
      { label: "Best-fit industries", prompt: "Which industries are best suited for this service?", icon: "building" },
      { label: "Related solutions", prompt: "Which other ZOBHUNGER solutions are related to this?", icon: "sparkles" },
    ];
  }

  if (categories.has("industries") || path.startsWith("/industries")) {
    return [
      { label: "Relevant services", prompt: "Which ZOBHUNGER services are most relevant for this industry?", icon: "briefcase" },
      { label: "Execution model", prompt: "How does ZOBHUNGER execute workforce operations for this industry?", icon: "users" },
      { label: "Hire workforce", prompt: "How can a company in this industry submit a workforce requirement?", icon: "building" },
    ];
  }

  if (categories.has("contact")) {
    return [
      { label: "Business contact", prompt: "Which contact should I use for a business requirement?", icon: "mail" },
      { label: "Office locations", prompt: "Where are ZOBHUNGER offices located?", icon: "map" },
      { label: "Hire workforce", prompt: "How do I submit a workforce requirement online?", icon: "briefcase" },
    ];
  }

  return [
    { label: "How it works", prompt: "Can you explain how this works step by step?", icon: "sparkles" },
    { label: "For businesses", prompt: "What should a business do next if it wants to work with ZOBHUNGER?", icon: "briefcase" },
    { label: "Related information", prompt: "What related ZOBHUNGER information should I know about this?", icon: "search" },
  ];
}
