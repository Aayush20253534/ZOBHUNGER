import Link from "next/link";
import { ArrowUpRight, Bot, Check, Copy } from "lucide-react";
import type { ChatbotUiMessage } from "@/lib/chatbot";
import { ChatbotRichText } from "./ChatbotRichText";

export type { ChatbotUiMessage } from "@/lib/chatbot";

interface ChatMessageProps {
  message: ChatbotUiMessage;
  copied?: boolean;
  onCopy?: (message: ChatbotUiMessage) => void;
}

export function ChatMessage({ message, copied = false, onCopy }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const sources = isAssistant ? (message.sources ?? []).slice(0, 4) : [];

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
        <div className="zb-chatbot-bubble"><ChatbotRichText content={message.content} /></div>

        {isAssistant && message.id !== "welcome" ? (
          <div className="zb-chatbot-message-actions">
            <button
              type="button"
              onClick={() => onCopy?.(message)}
              aria-label={copied ? "Response copied" : "Copy assistant response"}
            >
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        ) : null}

        {sources.length ? (
          <details className="zb-chatbot-sources">
            <summary>
              <span>Sources ({sources.length})</span>
              <span aria-hidden="true">+</span>
            </summary>
            <div>
              {sources.map((source) => (
                <Link href={source.url} key={`${source.url}:${source.title}`}>
                  <span>
                    <strong>{source.title}</strong>
                    <small>{source.category.replace(/-/g, " ")}</small>
                  </span>
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </article>
  );
}
