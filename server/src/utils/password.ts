import argon2 from "argon2";

// A valid Argon2id hash used only when an account lookup misses. Running the
// same expensive verification path reduces account-enumeration timing signals.
const DUMMY_PASSWORD_HASH = "$argon2id$v=19$m=65536,t=3,p=4$FwWK9g8/dRTbU4dqIqkkvg$7yvXy1dvSmoEt+9i80dFXiy4SsSLI81YQRTxiygI2KM";

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export async function verifyPasswordOrDummy(hash: string | null | undefined, password: string): Promise<boolean> {
  try { return await argon2.verify(hash || DUMMY_PASSWORD_HASH, password); }
  catch { return false; }
}
