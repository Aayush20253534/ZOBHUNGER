import type { RefObject } from "react";
import { MessageCircle } from "lucide-react";

interface ChatbotLauncherProps {
  open: boolean;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onOpen: () => void;
}

export function ChatbotLauncher({ open, buttonRef, onOpen }: ChatbotLauncherProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className="zb-chatbot-launcher"
      aria-label="Open ZOBHUNGER Assistant"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={onOpen}
      hidden={open}
    >
      <span className="zb-chatbot-launcher-pulse" aria-hidden="true" />
      <MessageCircle aria-hidden="true" strokeWidth={2.15} />
      <span className="zb-chatbot-launcher-label">Ask ZOBHUNGER</span>
    </button>
  );
}
