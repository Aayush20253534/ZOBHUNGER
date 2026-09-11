import { readFile } from "node:fs/promises";
import { resolveClientRuntimeConfig } from "../config/runtime-env.mjs";

async function loadLocalEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const text = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
      for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const index = line.indexOf("=");
        if (index <= 0) continue;
        const key = line.slice(0, index).trim();
        let value = line.slice(index + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
        if (process.env[key] === undefined) process.env[key] = value;
      }
    } catch {
      // Local env files are optional; deployment providers inject variables.
    }
  }
}

await loadLocalEnv();

try {
  const config = resolveClientRuntimeConfig(process.env);
  console.log(JSON.stringify({
    status: "ok",
    scope: "client environment",
    strictProduction: config.strictProduction,
    dataMode: config.dataMode,
    apiOrigin: new URL(config.apiUrl).origin,
    siteOrigin: config.siteUrl,
    appStoreLinks: {
      googlePlay: Boolean(config.googlePlayUrl),
      appStore: Boolean(config.appStoreUrl),
    },
  }, null, 2));
} catch (error) {
  console.error(`Client environment check failed: ${error instanceof Error ? error.message : "Invalid configuration"}`);
  process.exitCode = 1;
}
