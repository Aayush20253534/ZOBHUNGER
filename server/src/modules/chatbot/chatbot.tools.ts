import { randomUUID } from "node:crypto";
import type { AdminPermission } from "../../generated/prisma/client.js";
import { prisma } from "../../config/db.js";
import { HttpError } from "../../utils/http-error.js";
import { saveDraft } from "../phase2/drafts.service.js";
import type { ChatbotAction, ChatbotRequestActor, ChatbotToolAction, ChatbotToolExecutionResult } from "./chatbot.types.js";
import type { ChatbotLanguage } from "./chatbot.language.js";

interface RequirementDraftData {
  companyName: string;
  contactPerson: string;
  businessEmail: string;
  mobileNumber: string;
  industry: string;
  serviceRequired: string;
  workforceCount: number | null;
  locations: Array<{ name: string }>;
  projectDuration: string;
  expectedStartAt: string;
  details: string;
}

const JOB_INTENT = /\b(?:match(?:ing)? jobs?|jobs? for me|recommended jobs?|find (?:me )?(?:a )?job|mere liye (?:job|kaam)|job chahiye|naukri chahiye)\b/i;
const REQUIREMENT_STATUS_INTENT = /\b(?:my requirements?|requirement status|hiring request status|meri requirement|mera requirement|hiring ka status)\b/i;
const REQUIREMENT_DRAFT_INTENT = /\b(?:need|want|hire|require|looking for|chahiye)\b[\s\S]{0,100}\b(?:workers?|people|staff|promoters?|executives?|agents?|telecallers?|manpower|workforce|sales team|field team)\b/i;
const ADMIN_SUMMARY_INTENT = /\b(?:operations summary|dashboard summary|pending requirements|open requirements|ai leads|operational overview)\b/i;

function normalize(value: string) { return value.toLowerCase().replace(/[^a-z0-9\u0900-\u097f]+/g, " ").trim(); }
function tokenSet(values: string[]) { return new Set(normalize(values.join(" ")).split(/\s+/).filter((token) => token.length >= 2)); }

function requirementService(message: string) {
  const value = normalize(message);
  if (/telecall|telesales|calling/.test(value)) return "Telecaller / Telesales Services";
  if (/promoter|brand activation|sampling/.test(value)) return "Promoter / Brand Activation";
  if (/field sales|sales executive|customer acquisition/.test(value)) return "Sales Force";
  if (/verification|kyc|background/.test(value)) return "Verification Services";
  if (/delivery|logistics|rider/.test(value)) return "Gig / Delivery Workforce";
  return "Workforce Solutions";
}

function parseCount(message: string) {
  const explicit = message.match(/\b(\d{1,7})\s*(?:workers?|people|staff|promoters?|executives?|agents?|telecallers?|riders?|manpower|workforce)\b/i);
  const fallback = message.match(/\b(?:need|want|hire|require|chahiye)\s+(\d{1,7})\b/i);
  const value = Number(explicit?.[1] ?? fallback?.[1] ?? NaN);
  return Number.isInteger(value) && value > 0 && value <= 1_000_000 ? value : null;
}

function parseDuration(message: string) {
  const match = message.match(/\b(\d{1,3})\s*(days?|weeks?|months?|years?|din|hafte|mahine|saal)\b/i);
  return match ? `${match[1]} ${match[2]}` : "";
}

function parseLocations(message: string) {
  const match = message.match(/\b(?:in|at|for|mein)\s+([A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F .'-]{1,100}?)(?=\s+(?:for|from|starting|with|salary|at|for\s+\d|aur|and)\b|[,.!?]|$)/i);
  if (!match?.[1]) return [];
  return match[1].split(/\s*(?:,|\/|\band\b|\baur\b)\s*/i).map((item) => item.trim()).filter((item) => item.length >= 2).slice(0, 10);
}

function parseExpectedStartAt(message: string) {
  const iso = message.match(/\b(20\d{2})[-/]([01]\d)[-/]([0-3]\d)\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const indian = message.match(/\b([0-3]?\d)[-/]([01]?\d)[-/](20\d{2})\b/);
  if (!indian) return "";
  const day = Number(indian[1]);
  const month = Number(indian[2]);
  if (day < 1 || day > 31 || month < 1 || month > 12) return "";
  return `${indian[3]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

async function buildRequirementDraft(actor: ChatbotRequestActor, message: string): Promise<RequirementDraftData> {
  const profile = await prisma.businessProfile.findUnique({ where: { userId: actor.id } });
  return {
    companyName: profile?.companyName ?? "",
    contactPerson: profile?.contactPerson ?? "",
    businessEmail: actor.email,
    mobileNumber: profile?.phone ?? actor.phone ?? "",
    industry: profile?.industry ?? "",
    serviceRequired: requirementService(message),
    workforceCount: parseCount(message),
    locations: (parseLocations(message).length ? parseLocations(message) : [profile?.city ?? ""]).map((name) => ({ name })),
    projectDuration: parseDuration(message),
    expectedStartAt: parseExpectedStartAt(message),
    details: message.trim().slice(0, 6000),
  };
}

function localize(language: ChatbotLanguage, en: string, hi: string, hinglish: string) {
  return language === "hi" ? hi : language === "hinglish" ? hinglish : en;
}

async function workerJobMatches(actor: ChatbotRequestActor, language: ChatbotLanguage) {
  const profile = await prisma.workerProfile.findUnique({ where: { userId: actor.id } });
  if (!profile) return {
    answer: localize(language, "Your worker profile is not complete yet. Complete it first so I can match roles against your location, skills and preferences.", "आपकी worker profile अभी पूरी नहीं है। Location, skills और preferences के आधार पर jobs match करने के लिए पहले profile पूरी करें।", "Aapki worker profile abhi complete nahi hai. Location, skills aur preferences ke basis par matching ke liye pehle profile complete karein."),
    actions: [{ id: "worker-profile", label: "Complete worker profile", kind: "link", href: "/worker/profile" } satisfies ChatbotAction],
  };
  const jobs = await prisma.job.findMany({ where: { status: "OPEN", archivedAt: null, isDemo: false }, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }], take: 80 });
  const profileSkills = tokenSet(profile.skills);
  const locations = new Set([profile.city, profile.state, ...profile.preferredLocations].filter(Boolean).map((item) => normalize(String(item))));
  const categories = new Set(profile.preferredCategories.map(normalize));
  const engagements = new Set(profile.preferredEngagements.map(normalize));

  const scored = jobs.map((job) => {
    let score = 0;
    const reasons: string[] = [];
    const location = normalize(`${job.location} ${job.city} ${job.state ?? ""}`);
    if ([...locations].some((candidate) => candidate && location.includes(candidate))) { score += 35; reasons.push("location match"); }
    if (categories.has(normalize(job.category))) { score += 25; reasons.push("preferred category"); }
    if (engagements.has(normalize(job.engagementType))) { score += 15; reasons.push("preferred work type"); }
    const jobTokens = tokenSet([job.title, job.description, ...job.requirements, ...job.responsibilities]);
    const sharedSkills = [...profileSkills].filter((skill) => jobTokens.has(skill));
    score += Math.min(25, sharedSkills.length * 5);
    if (sharedSkills.length) reasons.push(`${sharedSkills.length} skill match${sharedSkills.length === 1 ? "" : "es"}`);
    return { job, score, reasons };
  }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score || (b.job.publishedAt?.getTime() ?? 0) - (a.job.publishedAt?.getTime() ?? 0)).slice(0, 5);

  if (!scored.length) return { answer: localize(language, "There are no strong live non-demo matches for your current profile right now.", "आपकी current profile के लिए अभी कोई strong live non-demo match उपलब्ध नहीं है।", "Aapki current profile ke liye abhi koi strong live non-demo match available nahi hai."), actions: [{ id: "browse-jobs", label: "Browse jobs", kind: "link", href: "/worker/jobs" } satisfies ChatbotAction] };
  const lines = scored.map(({ job, score, reasons }, index) => `${index + 1}. **${job.title}** · ${job.location} · ${Math.min(100, score)}% fit${reasons.length ? ` (${reasons.join(", ")})` : ""}`);
  return {
    answer: `${localize(language, "Best current matches from your worker profile:", "आपकी worker profile के आधार पर सबसे अच्छे current matches:", "Aapki worker profile ke basis par best current matches:")}\n\n${lines.join("\n")}`,
    actions: scored.slice(0, 3).map(({ job }, index) => ({ id: `job-match-${index}`, label: job.title, kind: "link" as const, href: `/worker/jobs/${encodeURIComponent(job.slug)}` })),
  };
}

async function businessRequirementStatus(actor: ChatbotRequestActor, language: ChatbotLanguage) {
  const items = await prisma.workforceRequirement.findMany({ where: { submittedByUserId: actor.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 5 });
  if (!items.length) return { answer: localize(language, "You do not have any submitted workforce requirements yet.", "आपके account से अभी कोई workforce requirement submit नहीं हुई है।", "Aapke account se abhi koi workforce requirement submit nahi hui hai."), actions: [{ id: "new-requirement", label: "Create requirement", kind: "link", href: "/business/requirements/new" } satisfies ChatbotAction] };
  const lines = items.map((item, index) => `${index + 1}. **${item.serviceRequired}** · ${item.workforceCount} people · ${item.jobLocation} · **${item.status}**`);
  return { answer: `${localize(language, "Your latest workforce requirements:", "आपकी latest workforce requirements:", "Aapki latest workforce requirements:")}\n\n${lines.join("\n")}`, actions: [{ id: "requirements", label: "Open requirements", kind: "link", href: "/business/requirements" } satisfies ChatbotAction] };
}

async function adminOperationalSummary(actor: ChatbotRequestActor, language: ChatbotLanguage) {
  const permissions = new Set(actor.adminPermissions ?? []);
  const isMainAdmin = actor.adminDepartment === "MAIN_ADMIN";
  const canRequirements = permissions.has("REQUIREMENTS_MANAGE" as AdminPermission) || isMainAdmin;
  const canJobs = permissions.has("JOBS_MANAGE" as AdminPermission) || isMainAdmin;
  const canAi = permissions.has("AI_ASSISTANT_MANAGE" as AdminPermission) || isMainAdmin;
  const [requirements, jobs, leads] = await Promise.all([
    canRequirements ? prisma.workforceRequirement.count({ where: { status: { in: ["NEW", "CONTACTED", "QUALIFIED"] } } }) : Promise.resolve(null),
    canJobs ? prisma.job.count({ where: { status: "OPEN", archivedAt: null } }) : Promise.resolve(null),
    canAi ? prisma.chatbotLead.count({ where: { status: { in: ["NEW", "CONTACTED", "QUALIFIED"] } } }) : Promise.resolve(null),
  ]);
  const lines = [requirements !== null ? `• Active requirements: **${requirements}**` : null, jobs !== null ? `• Published jobs: **${jobs}**` : null, leads !== null ? `• Open AI leads: **${leads}**` : null].filter(Boolean);
  if (!lines.length) throw new HttpError(403, "Your admin role does not permit these operational metrics.", { code: "CHATBOT_TOOL_FORBIDDEN" });
  return { answer: `${localize(language, "Current operational snapshot for your authorised admin scope:", "आपके authorised admin scope का current operational snapshot:", "Aapke authorised admin scope ka current operational snapshot:")}\n\n${lines.join("\n")}`, actions: [{ id: "admin-dashboard", label: "Open admin dashboard", kind: "link", href: "/admin" } satisfies ChatbotAction] };
}

export async function tryAuthenticatedChatbotTool(input: { message: string; actor?: ChatbotRequestActor; language: ChatbotLanguage; toolsEnabled: boolean }): Promise<{ answer: string; actions: ChatbotAction[]; toolName: string } | null> {
  if (!input.toolsEnabled || !input.actor) return null;
  const { actor, message, language } = input;
  if (actor.role === "WORKER" && JOB_INTENT.test(message)) return { ...(await workerJobMatches(actor, language)), toolName: "worker.job_match" };
  if (actor.role === "BUSINESS" && REQUIREMENT_STATUS_INTENT.test(message)) return { ...(await businessRequirementStatus(actor, language)), toolName: "business.requirement_status" };
  if (actor.role === "ADMIN" && ADMIN_SUMMARY_INTENT.test(message)) return { ...(await adminOperationalSummary(actor, language)), toolName: "admin.operations_summary" };
  if (actor.role === "BUSINESS" && REQUIREMENT_DRAFT_INTENT.test(message)) {
    const data = await buildRequirementDraft(actor, message);
    const summary = [data.workforceCount ? `${data.workforceCount} people` : "headcount not specified", data.serviceRequired, data.locations.map((item) => item.name).filter(Boolean).join(", ") || "location not specified", data.projectDuration || "duration not specified"].join(" · ");
    const action: ChatbotToolAction = { id: "save-requirement-draft", label: "Save this requirement draft", kind: "tool", tool: "business.save_requirement_draft", confirmationRequired: true, input: data };
    return { answer: `${localize(language, "I prepared a requirement draft from your message. Review it before saving:", "मैंने आपके message से requirement draft तैयार किया है। Save करने से पहले review करें:", "Maine aapke message se requirement draft prepare kiya hai. Save karne se pehle review karein:")}\n\n**${summary}**\n\n${localize(language, "Nothing will be submitted until you explicitly confirm and later submit the saved draft from your business workspace.", "आपकी explicit confirmation के बिना कुछ save नहीं होगा, और final submission business workspace से अलग से करनी होगी।", "Aapki explicit confirmation ke bina kuch save nahi hoga, aur final submission business workspace se separately karni hogi.")}`, actions: [action], toolName: "business.requirement_copilot" };
  }
  return null;
}

export async function executeConfirmedChatbotTool(actor: ChatbotRequestActor, tool: string, rawInput: unknown): Promise<ChatbotToolExecutionResult> {
  if (tool !== "business.save_requirement_draft") throw new HttpError(400, "Unsupported chatbot tool", { code: "CHATBOT_TOOL_UNSUPPORTED" });
  if (actor.role !== "BUSINESS") throw new HttpError(403, "This action requires a business account", { code: "BUSINESS_ACCOUNT_REQUIRED" });
  if (!rawInput || typeof rawInput !== "object" || Array.isArray(rawInput)) throw new HttpError(400, "Invalid requirement draft", { code: "CHATBOT_TOOL_INVALID_INPUT" });
  const candidate = rawInput as Partial<RequirementDraftData>;
  const profile = await prisma.businessProfile.findUnique({ where: { userId: actor.id } });
  const data: RequirementDraftData = {
    companyName: String(candidate.companyName || profile?.companyName || "").trim().slice(0, 160),
    contactPerson: String(candidate.contactPerson || profile?.contactPerson || "").trim().slice(0, 120),
    businessEmail: actor.email,
    mobileNumber: String(candidate.mobileNumber || profile?.phone || actor.phone || "").trim().slice(0, 24),
    industry: String(candidate.industry || profile?.industry || "").trim().slice(0, 120),
    serviceRequired: String(candidate.serviceRequired || "Workforce Solutions").trim().slice(0, 160),
    workforceCount: typeof candidate.workforceCount === "number" && Number.isInteger(candidate.workforceCount) && candidate.workforceCount >= 0 && candidate.workforceCount <= 1_000_000 ? candidate.workforceCount : null,
    locations: Array.isArray(candidate.locations) ? candidate.locations.slice(0, 50).map((item) => ({ name: String(item?.name ?? "").trim().slice(0, 180) })) : [{ name: "" }],
    projectDuration: String(candidate.projectDuration || "").trim().slice(0, 160),
    expectedStartAt: typeof candidate.expectedStartAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(candidate.expectedStartAt) ? candidate.expectedStartAt : "",
    details: String(candidate.details || "AI-assisted requirement draft").trim().slice(0, 6000),
  };
  const id = randomUUID();
  const draft = await saveDraft(actor.id, id, { revision: null, data });
  await prisma.auditLog.create({ data: { actorUserId: actor.id, action: "chatbot.tool.business_requirement_draft_saved", entityType: "RequirementDraft", entityId: id, metadata: { source: "AI_ASSISTANT" } } });
  return { tool, status: "completed", message: "Requirement draft saved. Review the remaining fields in your business workspace before submitting it.", action: { id: "open-saved-draft", label: "Review saved draft", kind: "link", href: `/business/requirements/drafts/${encodeURIComponent(id)}` }, data: { id: draft.id, revision: draft.revision } };
}
