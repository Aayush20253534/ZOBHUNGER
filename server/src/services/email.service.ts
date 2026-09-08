import { createRequire } from "node:module";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const require = createRequire(import.meta.url);

type MailjetClient = {
  post(resource: string, config?: { version?: string }): {
    request(data: unknown): Promise<unknown>;
  };
};

type MailjetConstructor = new (options: {
  apiKey: string;
  apiSecret: string;
}) => MailjetClient;

const Mailjet = require("node-mailjet") as MailjetConstructor;

export function recoveryEmailConfigured() {
  return Boolean(env.MAILJET_API_KEY && env.MAILJET_SECRET_KEY && env.MAIL_FROM_EMAIL);
}

export async function sendBusinessRecoveryEmail(email: string, link: string): Promise<boolean> {
  if (!recoveryEmailConfigured()) return false;
  try {
    const client = new Mailjet({ apiKey: env.MAILJET_API_KEY!, apiSecret: env.MAILJET_SECRET_KEY! });
    await client.post("send", { version: "v3.1" }).request({
      Messages: [{
        From: { Email: env.MAIL_FROM_EMAIL, Name: env.MAIL_FROM_NAME },
        To: [{ Email: email }],
        Subject: "Reset your ZOBHUNGER business password",
        TextPart: `Use this link to choose a new password for your business account:\n\n${link}\n\nThe link expires in 30 minutes and can be used once. If you did not request this, you can ignore this email. Your password has not changed.`,
      }],
    });
    return true;
  } catch {
    // Provider errors can contain the message body. Never log a recovery link or token.
    logger.warn("business.recovery_delivery_failed");
    return false;
  }
}

interface OperationalEmail {
  subject: string;
  text: string;
  to?: string;
  requestId?: string;
}

function configured() {
  return Boolean(
    env.MAILJET_API_KEY &&
      env.MAILJET_SECRET_KEY &&
      env.MAIL_FROM_EMAIL &&
      env.SALES_TEAM_EMAIL,
  );
}

export async function sendOperationalEmail(input: OperationalEmail) {
  const recipient = input.to ?? env.SALES_TEAM_EMAIL;

  if (!configured() || !recipient) {
    logger.warn("email.skipped", {
      requestId: input.requestId,
      subject: input.subject,
      reason: "Mailjet configuration is incomplete",
    });
    return false;
  }

  try {
    const client = new Mailjet({
      apiKey: env.MAILJET_API_KEY as string,
      apiSecret: env.MAILJET_SECRET_KEY as string,
    });

    await client.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: env.MAIL_FROM_EMAIL as string,
            Name: env.MAIL_FROM_NAME,
          },
          To: [{ Email: recipient }],
          Subject: input.subject,
          TextPart: input.text,
        },
      ],
    });

    logger.info("email.sent", {
      requestId: input.requestId,
      subject: input.subject,
      recipient,
    });
    return true;
  } catch (error) {
    logger.error("email.failed", error, {
      requestId: input.requestId,
      subject: input.subject,
      recipient,
    });
    return false;
  }
}
