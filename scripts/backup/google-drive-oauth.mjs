import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { findOrCreateBackupFolder, googleAuthorizationUrl, oauthExchangeAuthorizationCode } from "./google-drive.mjs";

const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID?.trim();
const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET?.trim();
if (!clientId || !clientSecret) {
  console.error("Set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET from a Google OAuth Desktop client before running this helper.");
  process.exit(1);
}

const host = "127.0.0.1";
const port = Number(process.env.GOOGLE_DRIVE_OAUTH_PORT || "53682");
const redirectUri = `http://${host}:${port}/oauth2/callback`;
const state = randomBytes(24).toString("hex");

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", redirectUri);
    if (url.pathname !== "/oauth2/callback") { res.writeHead(404).end("Not found"); return; }
    if (url.searchParams.get("state") !== state) throw new Error("OAuth state check failed");
    const error = url.searchParams.get("error");
    if (error) throw new Error(`Google OAuth returned ${error}`);
    const code = url.searchParams.get("code");
    if (!code) throw new Error("Google OAuth callback did not include an authorization code");

    const tokens = await oauthExchangeAuthorizationCode({ clientId, clientSecret, redirectUri, code });
    if (!tokens.refresh_token) throw new Error("Google did not issue a refresh token. Revoke the app grant and rerun with consent if necessary.");
    const folder = await findOrCreateBackupFolder(tokens.access_token);

    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end("<h1>ZOBHUNGER Drive backup authorized</h1><p>You can close this browser tab and return to the terminal.</p>");
    console.log("\nAuthorization complete. Add these values as GitHub Actions repository secrets:\n");
    console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log(`GOOGLE_DRIVE_FOLDER_ID=${folder.id}`);
    console.log(`\nDrive folder: ${folder.name}${folder.webViewLink ? ` (${folder.webViewLink})` : ""}`);
    console.log("Do not commit the refresh token to the repository.");
    server.close();
  } catch (error) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("Authorization failed. Check the terminal.");
    console.error(error instanceof Error ? error.message : error);
    server.close(() => { process.exitCode = 1; });
  }
});

server.listen(port, host, () => {
  const authUrl = googleAuthorizationUrl({ clientId, redirectUri, state });
  console.log(`Open this URL in your browser:\n\n${authUrl}\n`);
  console.log(`Waiting for Google to redirect to ${redirectUri} ...`);
});
