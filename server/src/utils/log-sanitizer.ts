const REDACTED = "[REDACTED]";

const sensitiveKeyPattern = /(?:^|_)(?:password|passwd|secret|token|authorization|cookie|set_cookie|api_key|client_secret|mfa_code|otp|recovery_code|webhook_signature)(?:$|_)/i;
const sensitiveCamelKeyPattern = /(?:password|passwd|secret|token|authorization|cookie|apiKey|clientSecret|mfaCode|otp|recoveryCode|webhookSignature)/i;

const sensitiveQueryKeys = new Set([
  "token",
  "access_token",
  "refresh_token",
  "activation",
  "activation_token",
  "reset_token",
  "password_reset_token",
  "invite_token",
  "invitation_token",
  "secret",
  "signature",
  "code",
]);

function isSensitiveKey(key: string) {
  return sensitiveKeyPattern.test(key.replace(/-/g, "_")) || sensitiveCamelKeyPattern.test(key);
}

function redactQueryString(value: string) {
  return value.replace(/([?&])([^=&#\s]+)=([^&#\s]*)/g, (match, separator: string, rawKey: string) => {
    let key = rawKey;
    try { key = decodeURIComponent(rawKey); } catch { /* keep raw */ }
    if (!sensitiveQueryKeys.has(key.toLowerCase())) return match;
    return `${separator}${rawKey}=${REDACTED}`;
  });
}

function redactFragments(value: string) {
  return value.replace(/(#(?:token|access_token|refresh_token|activation|reset_token|invite_token)=)[^&\s]*/gi, `$1${REDACTED}`);
}

function redactBearer(value: string) {
  return value.replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi, `Bearer ${REDACTED}`);
}

function redactKnownSecretPathSegments(value: string) {
  // Public payment checkout credentials are route parameters rather than query
  // values, so they must never be copied into request/platform logs.
  return value
    .replace(/(\/checkout\/)([^/?#\s]+)/gi, `$1${REDACTED}`)
    .replace(/(\/pay\/)([^/?#\s]+)/gi, `$1${REDACTED}`);
}

export function redactSensitiveText(value: string) {
  return redactKnownSecretPathSegments(redactFragments(redactQueryString(redactBearer(value))));
}

export function sanitizeRequestTarget(value: string) {
  return redactSensitiveText(value);
}

function sanitizeValue(value: unknown, keyHint = "", depth = 0, seen = new WeakSet<object>()): unknown {
  if (isSensitiveKey(keyHint)) return REDACTED;
  if (value == null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string") return redactSensitiveText(value);
  if (typeof value === "function" || typeof value === "symbol") return String(value);
  if (depth >= 6) return "[TRUNCATED]";
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactSensitiveText(value.message),
    };
  }
  if (typeof value !== "object") return value;
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);
  if (Array.isArray(value)) return value.slice(0, 100).map(item => sanitizeValue(item, keyHint, depth + 1, seen));

  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value).slice(0, 200)) {
    output[key] = sanitizeValue(nested, key, depth + 1, seen);
  }
  return output;
}

export function sanitizeLogContext(context: Record<string, unknown>) {
  return sanitizeValue(context) as Record<string, unknown>;
}
