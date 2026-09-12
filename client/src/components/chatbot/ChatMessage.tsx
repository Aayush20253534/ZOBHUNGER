import Link from "next/link";
import { ArrowUpRight, Bot } from "lucide-react";
import type { ChatbotSource } from "@/lib/chatbot";

export interface ChatbotUiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatbotSource[];
  includeInHistory: boolean;
}

interface ChatMessageProps {
  message: ChatbotUiMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  return (
    <article
      className={`zb-chatbot-message zb-chatbot-message--${message.role}`}
      aria-label={isAssistant ? "ZOBHUNGER Assistant" : "You"}
    >
      {isAssistant ? (
        <span className="zb-chatbot-message-avatar" aria-hidden="true">
          <Bot />
        </span>
      ) : null}
      <div className="zb-chatbot-message-content">
        <div className="zb-chatbot-bubble">{message.content}</div>
        {isAssistant && message.sources?.length ? (
          <div className="zb-chatbot-sources" aria-label="Related pages">
            <span>Related pages</span>
            <div>
              {message.sources.slice(0, 3).map((source) => (
                <Link href={source.url} key={`${source.url}:${source.title}`}>
                  <span>{source.title}</span>
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
