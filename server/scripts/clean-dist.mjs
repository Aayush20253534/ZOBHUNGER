import { rm } from "node:fs/promises";

// Remove only generated JavaScript so a deploy cannot reuse an older route tree.
await rm(new URL("../dist/", import.meta.url), { recursive: true, force: true });
