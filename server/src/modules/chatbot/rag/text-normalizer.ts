const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "can",
  "could",
  "do",
  "does",
  "for",
  "from",
  "give",
  "have",
  "help",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "please",
  "provide",
  "show",
  "tell",
  "that",
  "the",
  "their",
  "this",
  "to",
  "us",
  "want",
  "we",
  "what",
  "when",
  "where",
  "which",
  "who",
  "with",
  "become",
  "find",
  "get",
  "looking",
  "need",
  "should",
  "use",
  "would",
  "you",
  "your",
]);

const SYNONYM_GROUPS = [
  ["workforce", "manpower", "staffing", "staff", "recruitment", "hiring", "hire"],
  ["promoter", "promoters", "demonstrator", "demonstrators", "ambassador", "ambassadors"],
  ["job", "jobs", "career", "careers", "vacancy", "vacancies", "employment", "role", "roles"],
  ["retail", "store", "stores", "shop", "shops", "outlet", "outlets"],
  ["telecaller", "telecalling", "telesales", "calling", "callcenter", "callcentre"],
  ["verification", "verify", "kyc", "background", "screening"],
  ["partner", "partners", "partnership", "vendor", "vendors", "empanelment", "onboarding"],
  ["college", "institution", "campus", "placement", "university"],
  ["contact", "email", "phone", "address", "support"],
  ["location", "locations", "office", "offices", "presence", "branch", "branches"],
  ["business", "businesses", "company", "companies", "client", "clients"],
  ["worker", "workers", "candidate", "candidates", "applicant", "applicants"],
] as const;

const SYNONYM_MAP = new Map<string, Set<string>>();
for (const group of SYNONYM_GROUPS) {
  const normalizedGroup = group.map((term) => normalizeToken(term));
  for (const term of normalizedGroup) {
    const related = SYNONYM_MAP.get(term) ?? new Set<string>();
    for (const candidate of normalizedGroup) {
      if (candidate !== term) related.add(candidate);
    }
    SYNONYM_MAP.set(term, related);
  }
}

function stemToken(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith("ies") && token.length > 5) return `${token.slice(0, -3)}y`;
  if (token.endsWith("ing") && token.length > 6) return token.slice(0, -3);
  if (token.endsWith("ed") && token.length > 5) return token.slice(0, -2);
  if (/((ch|sh|x|z|ss)es)$/.test(token) && token.length > 5) return token.slice(0, -2);
  if (token.endsWith("s") && token.length > 4 && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

export function normalizeToken(value: string): string {
  return stemToken(
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "")
      .trim(),
  );
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[`*_>#\[\](){}|]/g, " ")
    .replace(/[^a-z0-9+./-]+/g, " ")
    .replace(/[./_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value: string, options: { removeStopWords?: boolean } = {}): string[] {
  const removeStopWords = options.removeStopWords ?? true;
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];

  const result: string[] = [];
  for (const rawToken of normalized.split(" ")) {
    const token = normalizeToken(rawToken);
    if (!token || token.length < 2) continue;
    if (removeStopWords && STOP_WORDS.has(token)) continue;
    result.push(token);
  }
  return result;
}

export function termFrequency(tokens: string[]): Map<string, number> {
  const frequency = new Map<string, number>();
  for (const token of tokens) frequency.set(token, (frequency.get(token) ?? 0) + 1);
  return frequency;
}

export interface ExpandedQueryTerm {
  term: string;
  weight: number;
  original: boolean;
}

export function expandQueryTerms(tokens: string[]): ExpandedQueryTerm[] {
  const weighted = new Map<string, ExpandedQueryTerm>();

  for (const token of tokens) {
    weighted.set(token, { term: token, weight: 1, original: true });
    for (const synonym of SYNONYM_MAP.get(token) ?? []) {
      if (weighted.has(synonym)) continue;
      weighted.set(synonym, { term: synonym, weight: 0.32, original: false });
    }
  }

  return [...weighted.values()];
}

export function buildQueryPhrases(tokens: string[]): string[] {
  const phrases = new Set<string>();
  const maxLength = Math.min(4, tokens.length);

  for (let size = 2; size <= maxLength; size += 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      phrases.add(tokens.slice(index, index + size).join(" "));
    }
  }

  return [...phrases];
}
