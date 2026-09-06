import { env } from "../config/env.js";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const rank: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function serializeError(error: unknown) {
  if (!(error instanceof Error)) return error;

  return {
    name: error.name,
    message: error.message,
    ...(env.NODE_ENV !== "production" && error.stack ? { stack: error.stack } : {}),
  };
}

function write(level: LogLevel, message: string, context: LogContext = {}) {
  if (rank[level] < rank[env.LOG_LEVEL]) return;

  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: "zobhunger-api",
    message,
    ...context,
  });

  if (level === "error") {
    console.error(record);
    return;
  }
  if (level === "warn") {
    console.warn(record);
    return;
  }
  console.log(record);
}

export const logger = {
  debug(message: string, context?: LogContext) {
    write("debug", message, context);
  },
  info(message: string, context?: LogContext) {
    write("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    write("warn", message, context);
  },
  error(message: string, error?: unknown, context: LogContext = {}) {
    write("error", message, {
      ...context,
      ...(error !== undefined ? { error: serializeError(error) } : {}),
    });
  },
};
