export type ChatbotLanguage = "en" | "hi" | "hinglish";

const DEVANAGARI = /[\u0900-\u097F]/;
const HINGLISH_WORDS = /\b(?:mujhe|chahiye|kaise|kya|hai|hain|mera|meri|mere|job|naukri|kaam|karna|karo|dikhao|batao|bataiye|kitna|kitne|wale|wali|mein|main|ke liye|aur|abhi|kal|mahine|din)\b/i;

export function detectChatbotLanguage(text: string): ChatbotLanguage {
  if (DEVANAGARI.test(text)) return "hi";
  const matches = text.match(new RegExp(HINGLISH_WORDS.source, "gi"))?.length ?? 0;
  return matches >= 2 ? "hinglish" : "en";
}

export function languageInstruction(language: ChatbotLanguage) {
  if (language === "hi") return "Reply in clear, professional Hindi using Devanagari. Keep product names and official route names unchanged.";
  if (language === "hinglish") return "Reply in natural professional Hinglish using Roman script, matching the user's style. Avoid forced translations of product names.";
  return "Reply in clear professional English.";
}

export function localizedUnknown(language: ChatbotLanguage) {
  if (language === "hi") return "मेरे पास इसका भरोसेमंद ZOBHUNGER स्रोत पर्याप्त नहीं है। मैं आपको सही टीम या आधिकारिक फॉर्म तक पहुँचा सकता हूँ।";
  if (language === "hinglish") return "Mere paas iske liye enough verified ZOBHUNGER information nahi hai. Main aapko sahi team ya official form tak direct kar sakta hoon.";
  return "I don’t have enough verified ZOBHUNGER information to answer that confidently. I can help you reach the right team or point you to the relevant official form instead.";
}
