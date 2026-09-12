import type { RefObject } from "react";
import { MessageCircle } from "lucide-react";

interface ChatbotLauncherProps {
  open: boolean;
  unreadCount: number;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onOpen: () => void;
}

export function ChatbotLauncher({ open, unreadCount, buttonRef, onOpen }: ChatbotLauncherProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className="zb-chatbot-launcher"
      aria-label={unreadCount > 0 ? `Open ZOBHUNGER Assistant, ${unreadCount} unread response${unreadCount === 1 ? "" : "s"}` : "Open ZOBHUNGER Assistant"}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={onOpen}
      hidden={open}
    >
      <span className="zb-chatbot-launcher-pulse" aria-hidden="true" />
      <MessageCircle aria-hidden="true" strokeWidth={2.15} />
      {unreadCount > 0 ? <span className="zb-chatbot-unread-badge" aria-hidden="true">{Math.min(unreadCount, 9)}</span> : null}
      <span className="zb-chatbot-launcher-label">Ask ZOBHUNGER</span>
    </button>
  );
}
