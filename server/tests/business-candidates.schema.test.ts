import assert from "node:assert/strict";
import test from "node:test";
import { candidateQuery, historyQuery, reviewCandidateSchema, safeResumeUrl, shareCandidateSchema } from "../src/modules/candidates/candidates.schema.js";

test("candidate filters reject unbounded pagination and ownership spoofing", () => {
  assert.deepEqual(candidateQuery.parse({}), { page: 1, query: "", status: "ALL" });
  for (const value of [{ page: 0 }, { page: 100001 }, { pageSize: 1000 }, { userId: "other" }, { status: "HIRED" }, { query: "a".repeat(101) }]) assert.equal(candidateQuery.safeParse(value).success, false);
  assert.equal(historyQuery.parse({ historyPage: "2" }).historyPage, 2);
  assert.equal(historyQuery.safeParse({ historyPage: -1 }).success, false);
});
test("CVs allow only credential-free HTTPS URLs", () => {
  assert.equal(safeResumeUrl("https://example.test/cv.pdf?download=1"), "https://example.test/cv.pdf?download=1");
  for (const value of [null, undefined, "", "relative.pdf", "javascript:alert(1)", "data:text/html,<script>", "http://example.test/cv", "file:///tmp/cv", "https://user:password@example.test/cv", "https://user@example.test/cv", "https://example.test/" + "a".repeat(2000)]) assert.equal(safeResumeUrl(value), null);
});
test("candidate sharing normalizes skills without accepting injected status or owner fields", () => {
  const input = { requirementId: "req-1", applicationId: "app-1", skills: ["Retail", " Reporting ", "retail"], summary: " Relevant market experience. " };
  const parsed = shareCandidateSchema.parse(input);
  assert.deepEqual(parsed.skills, ["Retail", "Reporting"]);
  assert.equal(parsed.summary, "Relevant market experience.");
  assert.equal(shareCandidateSchema.safeParse({ ...input, status: "SELECTED" }).success, false);
  assert.equal(shareCandidateSchema.safeParse({ ...input, skills: Array(13).fill("Skill") }).success, false);
});
test("interviews require a timezone and cannot be set through the status-only action", () => {
  const input = { action: "INTERVIEW", revision: 0, note: "Review discussion", interviewMode: "VIDEO", interviewDetails: "Coordinate a call", interviewAt: "2026-10-01T10:30:00+05:30" };
  const parsed = reviewCandidateSchema.parse(input);
  assert.equal(parsed.action, "INTERVIEW");
  if (parsed.action === "INTERVIEW") assert.equal(parsed.interviewAt.toISOString(), "2026-10-01T05:00:00.000Z");
  for (const interviewAt of ["2026-10-01T10:30:00", "2026-02-30T10:30:00Z", "invalid"]) assert.equal(reviewCandidateSchema.safeParse({ ...input, interviewAt }).success, false);
  assert.equal(reviewCandidateSchema.safeParse({ action: "STATUS", revision: 0, note: "No interview details", status: "INTERVIEW_REQUESTED" }).success, false);
});
test("all review writes require bounded notes and an integer revision", () => {
  for (const value of [{ action: "FEEDBACK", note: "Feedback" }, { action: "FEEDBACK", revision: -1, note: "Feedback" }, { action: "FEEDBACK", revision: 0.5, note: "Feedback" }, { action: "FEEDBACK", revision: 0, note: "  " }, { action: "FEEDBACK", revision: 0, note: "a".repeat(2001) }]) assert.equal(reviewCandidateSchema.safeParse(value).success, false);
});
