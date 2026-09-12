import { beforeEach, describe, expect, it } from "vitest";
import {
  chatbotStorageInternals,
  clearStoredChatbotConversation,
  loadStoredChatbotConversation,
  saveStoredChatbotConversation,
} from "@/lib/chatbot-storage";

beforeEach(() => window.localStorage.clear());

describe("chatbot local persistence", () => {
  it("stores only successful history messages", () => {
    saveStoredChatbotConversation({
      id: "chat_test",
      createdAt: "2026-09-12T00:00:00.000Z",
      updatedAt: "2026-09-12T00:01:00.000Z",
      messages: [
        { id: "welcome", role: "assistant", content: "Welcome", includeInHistory: false },
        { id: "u1", role: "user", content: "Successful", includeInHistory: true },
        { id: "u2", role: "user", content: "Failed", includeInHistory: false },
      ],
    });

    expect(loadStoredChatbotConversation()?.messages.map((message) => message.content)).toEqual(["Successful"]);
  });

  it("drops unsafe private source URLs when restoring browser-controlled data", () => {
    window.localStorage.setItem(chatbotStorageInternals.key, JSON.stringify({
      version: 1,
      id: "chat_test",
      createdAt: "2026-09-12T00:00:00.000Z",
      updatedAt: "2026-09-12T00:01:00.000Z",
      messages: [{
        id: "a1",
        role: "assistant",
        content: "Answer",
        sources: [
          { title: "Public", url: "/promoter-solutions", category: "services" },
          { title: "Private", url: "/admin/security", category: "admin" },
          { title: "Placement private", url: "/placement-portal/applications", category: "other" },
          { title: "External", url: "https://example.com", category: "other" },
        ],
      }],
    }));

    expect(loadStoredChatbotConversation()?.messages[0]?.sources).toEqual([
      { title: "Public", url: "/promoter-solutions", category: "services" },
    ]);
  });

  it("clears the stored conversation", () => {
    window.localStorage.setItem(chatbotStorageInternals.key, "{}");
    clearStoredChatbotConversation();
    expect(window.localStorage.getItem(chatbotStorageInternals.key)).toBeNull();
  });
});
