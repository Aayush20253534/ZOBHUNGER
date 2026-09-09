"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { WorkerProfileInput } from "@/types/worker.types";
export const listFields = ["skills", "languages", "preferredLocations", "preferredCategories", "preferredEngagements"] as const;
export type ListField = (typeof listFields)[number];
export type WorkerDraft = { values: WorkerProfileInput; lists: Record<ListField, string> };
const Context = createContext<{ draft: WorkerDraft | null; setDraft: (draft: WorkerDraft | null) => void } | null>(null);
export function WorkerDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<WorkerDraft | null>(null);
  return <Context.Provider value={{ draft, setDraft }}>{children}</Context.Provider>;
}
export function useWorkerDraft() { const value = useContext(Context); if (!value) throw new Error("WorkerDraftProvider is required"); return value; }
