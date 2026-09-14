import Link from "next/link";
import { ArrowUpRight, Bot, Check, Copy } from "lucide-react";
import type { ChatbotAction, ChatbotUiMessage } from "@/lib/chatbot";
import { ChatbotRichText } from "./ChatbotRichText";

export type { ChatbotUiMessage } from "@/lib/chatbot";

interface ChatMessageProps {
  message: ChatbotUiMessage;
  copied?: boolean;
  onCopy?: (message: ChatbotUiMessage) => void;
  onAction?: (action: ChatbotAction) => void;
}

export function ChatMessage({ message, copied = false, onCopy, onAction }: ChatMessageProps) {
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


        {isAssistant && message.actions?.length ? (
          <div className="zb-chatbot-answer-actions">
            {message.actions.slice(0, 4).map((action) => action.kind === "link" ? (
              <Link href={action.href} key={action.id} className="zb-chatbot-answer-action">{action.label}<ArrowUpRight aria-hidden="true" /></Link>
            ) : (
              <button type="button" key={action.id} className="zb-chatbot-answer-action" onClick={() => onAction?.(action)}>{action.label}<ArrowUpRight aria-hidden="true" /></button>
            ))}
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
                    <strong>[{source.citation}] {source.title}</strong>
                    <small>{source.section ? `${source.category.replace(/-/g, " ")} · ${source.section}` : source.category.replace(/-/g, " ")}</small>
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
