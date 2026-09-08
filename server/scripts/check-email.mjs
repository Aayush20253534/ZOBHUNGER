import { checkMailjetConfiguration } from "../src/services/mailjet.client.js";

const result = await checkMailjetConfiguration();
console.log(JSON.stringify(result, null, 2));
if (!result.ready) process.exitCode = 1;
