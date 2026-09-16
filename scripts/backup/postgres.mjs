import { spawn } from "node:child_process";

function connectionEnvironment(connectionUrl) {
  let url;
  try {
    url = new URL(connectionUrl);
  } catch {
    throw new Error("Database URL is not a valid PostgreSQL connection URL");
  }
  if (!/^postgres(?:ql)?:$/.test(url.protocol)) throw new Error("Backup database URL must use postgresql:// or postgres://");
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!database) throw new Error("Backup database URL must include a database name");

  const env = {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: database,
  };

  const sslmode = url.searchParams.get("sslmode");
  if (sslmode) env.PGSSLMODE = sslmode;
  else if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") env.PGSSLMODE = "require";
  return env;
}

function run(command, args, env, { capture = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      stdio: capture ? ["ignore", "pipe", "pipe"] : ["ignore", "inherit", "inherit"],
    });
    let stdout = "";
    let stderr = "";
    if (capture) {
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", chunk => { stdout += chunk; });
      child.stderr.on("data", chunk => { stderr += chunk; });
    }
    child.on("error", reject);
    child.on("exit", code => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exited with code ${code}${capture && stderr ? `: ${stderr.trim()}` : ""}`));
    });
  });
}

export async function pgDumpVersion() {
  const { stdout } = await run("pg_dump", ["--version"], process.env, { capture: true });
  return stdout.trim();
}

export async function createPostgresDump(connectionUrl, outputPath) {
  const env = connectionEnvironment(connectionUrl);
  await run("pg_dump", [
    "--format=custom",
    "--compress=6",
    "--no-owner",
    "--no-acl",
    "--file", outputPath,
  ], env);
}

export async function verifyPostgresDumpArchive(dumpPath) {
  const { stdout } = await run("pg_restore", ["--list", dumpPath], process.env, { capture: true });
  if (!stdout.trim()) throw new Error("pg_restore returned an empty archive listing");
  return stdout;
}

export async function restorePostgresDump(dumpPath, restoreUrl) {
  const env = connectionEnvironment(restoreUrl);
  await run("pg_restore", [
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-acl",
    "--exit-on-error",
    "--dbname", env.PGDATABASE,
    dumpPath,
  ], env);
}

export function databaseIdentity(connectionUrl) {
  const url = new URL(connectionUrl);
  return {
    host: url.hostname.toLowerCase(),
    port: url.port || "5432",
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
  };
}
