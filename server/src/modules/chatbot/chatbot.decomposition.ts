const MULTI_QUESTION = /[?？]+/;
const JOINERS = /\s+(?:and also|also|plus|as well as|along with|aur|saath hi)\s+/i;
const INTERROGATIVE = /\b(?:what|how|where|when|which|who|can|do|does|is|are|tell|show|find|need|kya|kaise|kahan|kab|batao|dikhao|chahiye)\b/i;

function clean(part: string) { return part.trim().replace(/^[,;:\-\s]+|[,;:\-\s]+$/g, ""); }

export function decomposeChatbotQuery(message: string, enabled = true): string[] {
  const original = clean(message);
  if (!enabled || original.length < 35) return original ? [original] : [];

  const questionParts = message.split(MULTI_QUESTION).map(clean).filter(Boolean);
  let parts = questionParts.length > 1 ? questionParts : message.split(JOINERS).map(clean).filter(Boolean);
  parts = parts.filter((part) => part.length >= 8 && (INTERROGATIVE.test(part) || parts.length <= 2));
  if (parts.length <= 1) return original ? [original] : [];

  const unique: string[] = [];
  for (const part of parts) {
    const normalized = part.toLowerCase().replace(/\s+/g, " ");
    if (!unique.some((item) => item.toLowerCase().replace(/\s+/g, " ") === normalized)) unique.push(part);
    if (unique.length >= 4) break;
  }
  return unique.length > 1 ? unique : [original];
}
