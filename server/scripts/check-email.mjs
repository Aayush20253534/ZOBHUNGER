import { checkResendConfiguration } from "../src/services/resend.client.js";

const result = await checkResendConfiguration();
console.log(JSON.stringify(result, null, 2));
if (!result.ready) process.exitCode = 1;
