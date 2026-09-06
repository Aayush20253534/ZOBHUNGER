import { createMockAdapter } from "@/mocks/adapter";
import { httpAdapter } from "@/services/adapters/http.adapter";
import type { SiteDataAdapter } from "@/types/data.types";

const mockAdapter = createMockAdapter();

export function getDataMode(): "mock" | "api" {
  const mode = process.env.NEXT_PUBLIC_DATA_MODE ?? "mock";
  if (mode !== "mock" && mode !== "api")
    throw new Error("NEXT_PUBLIC_DATA_MODE must be 'mock' or 'api'.");
  return mode;
}

export function getDataAdapter(): SiteDataAdapter {
  return getDataMode() === "api" ? httpAdapter : mockAdapter;
}
