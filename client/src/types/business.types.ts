import type { AuthUser } from "./auth.types";

export interface BusinessProfileInput {
  companyName: string;
  contactPerson: string;
  phone: string;
  industry: string;
  city: string;
  state: string;
  website: string;
}

export interface BusinessProfile {
  id: string;
  userId: string;
  companyName: string;
  contactPerson: string;
  phone: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  onboardedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessWorkspace { user: AuthUser; profile: BusinessProfile | null }
