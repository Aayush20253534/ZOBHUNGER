import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";

export type ChatbotMessageRole = "user" | "assistant";

export interface ChatbotHistoryMessage {
  role: ChatbotMessageRole;
  content: string;
}

export interface ChatbotSource {
  title: string;
  url: string;
  category: string;
}

export interface ChatbotReply {
  answer: string;
  sources: ChatbotSource[];
  grounded: boolean;
}

export interface SendChatbotMessageInput {
  message: string;
  history?: ChatbotHistoryMessage[];
  currentPage?: string;
}

export async function sendChatbotMessage(input: SendChatbotMessageInput): Promise<ChatbotReply> {
  const response = await apiFetch<ApiSuccessEnvelope<ChatbotReply>>("/chatbot/messages", {
    method: "POST",
    body: JSON.stringify({
      message: input.message,
      history: input.history ?? [],
      ...(input.currentPage ? { currentPage: input.currentPage } : {}),
    }),
  });

  return response.data;
}
