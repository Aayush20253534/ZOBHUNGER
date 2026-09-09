import { env } from "../src/config/env.js";
import { privateFileStorageConfigured } from "../src/services/private-file-storage.js";
const ok = privateFileStorageConfigured();
console.log(JSON.stringify({ provider: "cloudinary", configured: ok, folder: env.CLOUDINARY_PRIVATE_FOLDER }, null, 2));
if (env.NODE_ENV === "production" && !ok) process.exitCode = 1;
