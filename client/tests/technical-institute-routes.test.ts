import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REQUIRED_TECHNICAL_INSTITUTE_ROUTES = [
  "src/app/technical-institute-login/page.tsx",
  "src/app/technical-institute-portal/layout.tsx",
  "src/app/technical-institute-portal/page.tsx",
  "src/app/technical-institute-portal/students/page.tsx",
  "src/app/technical-institute-portal/opportunities/page.tsx",
  "src/app/technical-institute-portal/applications/page.tsx",
  "src/app/technical-institute-portal/reports/page.tsx",
] as const;

describe("technical institute partner portal routes", () => {
  for (const route of REQUIRED_TECHNICAL_INSTITUTE_ROUTES) {
    it(`keeps ${route} mounted`, () => {
      expect(existsSync(resolve(process.cwd(), route))).toBe(true);
    });
  }
});
