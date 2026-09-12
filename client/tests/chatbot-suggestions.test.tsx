import { describe, expect, it } from "vitest";
import { getFollowUpSuggestions, getStarterSuggestions } from "@/lib/chatbot-suggestions";

describe("chatbot page-aware suggestions", () => {
  it("uses worker-oriented starters on jobs pages", () => {
    const labels = getStarterSuggestions("/jobs").map((suggestion) => suggestion.label);
    expect(labels).toContain("How to apply");
    expect(labels).toContain("Find jobs");
  });

  it("uses vendor-specific starters on vendor empanelment", () => {
    const labels = getStarterSuggestions("/vendor-empanelment").map((suggestion) => suggestion.label);
    expect(labels).toContain("Required documents");
    expect(labels).toContain("Project allocation");
  });

  it("uses source category to create contextual service follow-ups", () => {
    const labels = getFollowUpSuggestions({
      pathname: "/promoter-solutions",
      sources: [{ title: "Promoters", url: "/promoter-solutions", category: "services" }],
      userMessage: "Do you provide promoters?",
    }).map((suggestion) => suggestion.label);
    expect(labels).toContain("Request this service");
    expect(labels).toContain("Related solutions");
  });
});
