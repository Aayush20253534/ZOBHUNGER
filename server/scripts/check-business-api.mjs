import { checkBusinessRoutes } from "./business-route-checks.mjs";

try {
  const results = await checkBusinessRoutes(process.argv[2] ?? process.env.SMOKE_API_URL ?? "http://localhost:5000/api/v1");
  for (const { method, path, status } of results) console.log(`PASS ${method} ${path}: ${status}`);
  console.log("Business endpoints are deployed. The 401/400 responses above are expected without credentials or valid form data.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Business API check failed.");
  process.exitCode = 1;
}
