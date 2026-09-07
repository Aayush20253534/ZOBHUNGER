import {
  BadgeIndianRupee,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  Handshake,
  Laptop2,
  Megaphone,
  Network,
  PanelsTopLeft,
  Route,
  Target,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

export const partnerProgramIntro = {
  eyebrow: "Independent Business Partner Program",
  title: "Become an Independent Business Partner.",
  subtitle: "Build Business. Create Opportunities. Grow With Freedom.",
  description:
    "Join a network of experienced professionals, industry experts, consultants and business specialists who want to contribute their expertise while maintaining their professional independence.",
} as const;

export const partnerProfiles = [
  { title: "Industry Experts", icon: Target },
  { title: "Business Development Professionals", icon: ChartNoAxesCombined },
  { title: "Consultants", icon: BriefcaseBusiness },
  { title: "Sales & Marketing Professionals", icon: Megaphone },
  { title: "Recruitment & HR Experts", icon: UsersRound },
  { title: "Operations Professionals", icon: PanelsTopLeft },
  { title: "Technology Experts", icon: Laptop2 },
  { title: "Project Management Professionals", icon: Route },
  { title: "Entrepreneurs & Business Owners", icon: Building2 },
  { title: "Domain Specialists", icon: UserRoundCheck },
] as const;

export const partnerContributions = [
  "Bring business opportunities",
  "Introduce potential clients",
  "Share industry expertise",
  "Support project planning",
  "Help in business expansion",
  "Develop new markets",
  "Build strategic partnerships",
  "Support sales & marketing",
  "Recruitment & workforce solutions",
  "Operations & project execution support",
] as const;

export const partnerFreedomPoints = [
  "Continue your existing job or business",
  "Work from anywhere",
  "No exclusive employment requirement",
  "Contribute based on your specialization",
  "Flexible involvement based on availability",
  "Access Pan-India business opportunities",
  "Build long-term professional relationships",
] as const;

export const partnerEarningModels = [
  { title: "Revenue Share", icon: CircleDollarSign },
  { title: "Project-Based Profit Share", icon: BadgeIndianRupee },
  { title: "Commission", icon: Network },
  { title: "Success Fee", icon: Handshake },
] as const;

export const partnerProcess = [
  {
    step: "01",
    title: "Apply",
    description: "Submit your profile and area of specialization.",
  },
  {
    step: "02",
    title: "Connect",
    description:
      "Our team reviews your profile and connects with you to understand your expertise and potential contribution.",
  },
  {
    step: "03",
    title: "Collaborate",
    description:
      "Explore relevant business opportunities, projects, clients or areas where you can contribute.",
  },
  {
    step: "04",
    title: "Grow Together",
    description:
      "Earn based on mutually agreed project contribution and commercial terms.",
  },
] as const;
