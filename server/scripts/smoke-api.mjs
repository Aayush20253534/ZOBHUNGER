const baseUrl = (process.env.SMOKE_API_URL ?? "http://localhost:5000/api/v1").replace(/\/$/, "");

async function request(path, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: "application/json" },
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${path} returned non-JSON body: ${text.slice(0, 120)}`);
  }

  if (response.status !== expectedStatus) {
    throw new Error(`${path} expected ${expectedStatus}, got ${response.status}: ${text}`);
  }
  if (!body || body.success !== true) {
    throw new Error(`${path} did not return the success envelope`);
  }

  console.log(`PASS ${response.status} ${path}`);
  return body;
}

console.log(`Smoke testing ${baseUrl}`);
await request("/health");
await request("/jobs?page=1&pageSize=1");
await request("/articles?page=1&pageSize=1");
console.log("Public Phase 1 API smoke test passed.");
