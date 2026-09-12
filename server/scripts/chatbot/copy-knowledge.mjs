import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(scriptDir, "../..");
const source = path.join(serverRoot, "src/modules/chatbot/knowledge");
const destination = path.join(serverRoot, "dist/modules/chatbot/knowledge");

await mkdir(destination, { recursive: true });

for (const directory of [
  "company",
  "services",
  "industries",
  "workers",
  "businesses",
  "jobs",
  "partnerships",
  "case-studies",
  "contact",
  "policies",
  "_templates",
]) {
  const sourceDirectory = path.join(source, directory);
  const destinationDirectory = path.join(destination, directory);
  await rm(destinationDirectory, { recursive: true, force: true });
  await cp(sourceDirectory, destinationDirectory, { recursive: true });
}

await cp(path.join(source, "README.md"), path.join(destination, "README.md"));
console.log("Copied chatbot knowledge files into dist.");
