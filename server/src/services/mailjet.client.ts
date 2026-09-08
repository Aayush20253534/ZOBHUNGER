import { createRequire } from "node:module";
import { env } from "../config/env.js";
import { assertMailjetAccepted, mailjetDiagnostic } from "./mailjet-errors.js";

const require = createRequire(import.meta.url);
export interface MailjetMessage {
  From: { Email: string; Name: string };
  To: { Email: string }[];
  Subject: string;
  TextPart: string;
  HTMLPart?: string;
  TrackClicks?: "disabled";
  TrackOpens?: "disabled";
}
type MailjetConstructor = new (settings: {
  apiKey: string; apiSecret: string; options: { timeout: number };
}) => { post(resource: string, config: { version: string; host: string }): { request(data: unknown): Promise<unknown> } };
const Mailjet = require("node-mailjet") as MailjetConstructor;

export function missingMailjetSettings(): string[] {
  return (["MAILJET_API_KEY", "MAILJET_SECRET_KEY", "MAIL_FROM_EMAIL"] as const).filter(key => !env[key]);
}

export async function postMailjetMessage(message: MailjetMessage, sandbox = false): Promise<void> {
  const client = new Mailjet({ apiKey: env.MAILJET_API_KEY!, apiSecret: env.MAILJET_SECRET_KEY!, options: { timeout: env.MAILJET_TIMEOUT_MS } });
  const result = await client.post("send", { version: "v3.1", host: env.MAILJET_API_HOST }).request({
    Messages: [message], ...(sandbox ? { SandboxMode: true } : {}),
  });
  assertMailjetAccepted(result);
}

// Mailjet validates the real sender/key configuration without delivering mail.
export async function checkMailjetConfiguration() {
  const missing = missingMailjetSettings();
  if (missing.length) return { ready: false, reason: "configuration", missing };
  try {
    await postMailjetMessage({ From: { Email: env.MAIL_FROM_EMAIL!, Name: env.MAIL_FROM_NAME },
      To: [{ Email: env.MAIL_FROM_EMAIL! }], Subject: "ZOBHUNGER email configuration check",
      TextPart: "Sandbox configuration validation. No email is delivered.", TrackClicks: "disabled", TrackOpens: "disabled" }, true);
    return { ready: true, host: env.MAILJET_API_HOST, salesNotificationsConfigured: Boolean(env.SALES_TEAM_EMAIL),
      message: "Mailjet accepted the sandbox check. No email was sent; inbox delivery is not tested." };
  } catch (error) { return { ready: false, host: env.MAILJET_API_HOST, ...mailjetDiagnostic(error) }; }
}
