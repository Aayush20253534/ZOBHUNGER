import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = String(__ENV.LOAD_BASE_URL || "").replace(/\/$/, "");
if (!BASE_URL) throw new Error("LOAD_BASE_URL is required");
const API = `${BASE_URL}/api/v1`;
const ORIGIN = __ENV.LOAD_ORIGIN || "";
const PROFILE = __ENV.LOAD_PROFILE || "baseline";
const DURATION = __ENV.LOAD_DURATION || (PROFILE === "stress" ? "5m" : "2m");
const providerTrafficAllowed = __ENV.LOAD_CONFIRM_PROVIDER_TRAFFIC === "yes";
const mutationTrafficAllowed = __ENV.LOAD_MUTATION_ACK === "disposable-test-account";

const functionalFailure = new Rate("functional_failure");
const authLatency = new Trend("auth_latency", true);

const scenarioDefinitions = {};
function addScenario(name, exec, rate = 1) {
  if (PROFILE === "smoke") {
    scenarioDefinitions[name] = { executor: "per-vu-iterations", vus: 1, iterations: 2, maxDuration: "1m", exec };
    return;
  }
  if (PROFILE === "stress") {
    scenarioDefinitions[name] = {
      executor: "ramping-arrival-rate",
      startRate: Math.max(1, rate),
      timeUnit: "1s",
      preAllocatedVUs: Math.max(5, rate * 2),
      maxVUs: Math.max(20, rate * 8),
      stages: [
        { target: rate * 2, duration: "1m" },
        { target: rate * 5, duration: "2m" },
        { target: rate * 8, duration: "1m" },
        { target: rate * 2, duration: "1m" },
      ],
      exec,
    };
    return;
  }
  scenarioDefinitions[name] = {
    executor: "constant-arrival-rate",
    rate,
    timeUnit: "1s",
    duration: DURATION,
    preAllocatedVUs: Math.max(3, rate * 2),
    maxVUs: Math.max(15, rate * 6),
    exec,
  };
}

addScenario("public_reads", "publicReads", Number(__ENV.LOAD_PUBLIC_RPS || 8));
if (__ENV.LOAD_BUSINESS_IDENTIFIER && __ENV.LOAD_BUSINESS_PASSWORD) addScenario("business_reads", "businessReads", Number(__ENV.LOAD_BUSINESS_RPS || 4));
if (__ENV.LOAD_WORKER_EMAIL && __ENV.LOAD_WORKER_PASSWORD) addScenario("worker_reads", "workerReads", Number(__ENV.LOAD_WORKER_RPS || 3));
if (__ENV.LOAD_PLACEMENT_EMAIL && __ENV.LOAD_PLACEMENT_PASSWORD) addScenario("placement_reads", "placementReads", Number(__ENV.LOAD_PLACEMENT_RPS || 3));
if (__ENV.LOAD_TECHNICAL_EMAIL && __ENV.LOAD_TECHNICAL_PASSWORD) addScenario("technical_reads", "technicalReads", Number(__ENV.LOAD_TECHNICAL_RPS || 3));
if (__ENV.LOAD_ADMIN_COOKIE) addScenario("admin_reads", "adminReads", Number(__ENV.LOAD_ADMIN_RPS || 2));
if (__ENV.LOAD_ENABLE_CHATBOT === "1" && providerTrafficAllowed) addScenario("chatbot", "chatbotTraffic", 1);
if (__ENV.LOAD_PAYMENT_CHECKOUT_TOKEN && providerTrafficAllowed) addScenario("payment_refresh", "paymentRefresh", 1);
if (__ENV.LOAD_ENABLE_UPLOADS === "1" && mutationTrafficAllowed && __ENV.LOAD_WORKER_EMAIL && __ENV.LOAD_WORKER_PASSWORD) addScenario("resume_upload", "resumeUpload", 1);

export const options = {
  scenarios: scenarioDefinitions,
  thresholds: {
    checks: ["rate>0.99"],
    functional_failure: ["rate<0.01"],
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800", "p(99)<1500"],
    auth_latency: ["p(95)<1200"],
  },
};

const sessions = Object.create(null);
const JSON_HEADERS = { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", ...(ORIGIN ? { Origin: ORIGIN } : {}) };

function good(response, expected = 200, label = "request") {
  const ok = check(response, { [`${label}: status ${expected}`]: (res) => res.status === expected });
  functionalFailure.add(!ok, { endpoint: label });
  return ok;
}

function apiGet(path, label = `GET ${path}`, headers = {}) {
  const response = http.get(`${API}${path}`, { headers, tags: { name: label } });
  good(response, 200, label);
  return response;
}

function loginOnce(key, path, payload) {
  if (sessions[key]) return true;
  const response = http.post(`${API}${path}`, JSON.stringify(payload), { headers: JSON_HEADERS, tags: { name: `POST ${path}` } });
  authLatency.add(response.timings.duration, { role: key });
  if (!good(response, 200, `${key} login`)) return false;
  sessions[key] = true;
  return true;
}

function businessLogin() {
  return loginOnce("business", "/auth/business-login", { identifier: __ENV.LOAD_BUSINESS_IDENTIFIER, password: __ENV.LOAD_BUSINESS_PASSWORD });
}
function workerLogin() {
  return loginOnce("worker", "/auth/worker/login", { email: __ENV.LOAD_WORKER_EMAIL, password: __ENV.LOAD_WORKER_PASSWORD });
}
function placementLogin() {
  return loginOnce("placement", "/auth/placement-cell-login", { email: __ENV.LOAD_PLACEMENT_EMAIL, password: __ENV.LOAD_PLACEMENT_PASSWORD });
}
function technicalLogin() {
  return loginOnce("technical", "/auth/technical-institute-login", { email: __ENV.LOAD_TECHNICAL_EMAIL, password: __ENV.LOAD_TECHNICAL_PASSWORD });
}

export function publicReads() {
  apiGet("/health", "GET health");
  apiGet("/jobs?page=1&pageSize=12", "GET public jobs");
  apiGet("/articles?page=1&pageSize=6", "GET public articles");
  sleep(0.15);
}

export function businessReads() {
  if (!businessLogin()) return sleep(1);
  apiGet("/business/workspace", "GET business workspace");
  apiGet("/business/dashboard?range=30&status=ALL&page=1", "GET business dashboard");
  apiGet("/business/requirements?page=1&pageSize=20", "GET business requirements");
  apiGet("/business/attendance?page=1&status=ALL", "GET business attendance");
  sleep(0.1);
}

export function workerReads() {
  if (!workerLogin()) return sleep(1);
  apiGet("/workers/workspace", "GET worker workspace");
  apiGet("/workers/dashboard", "GET worker dashboard");
  apiGet("/workers/jobs?page=1&pageSize=12", "GET worker jobs");
  apiGet("/workers/applications?page=1&status=ALL&source=ALL", "GET worker applications");
  sleep(0.1);
}

export function placementReads() {
  if (!placementLogin()) return sleep(1);
  apiGet("/placement-cell-applications/portal/profile", "GET placement profile");
  apiGet("/placement-cell-applications/portal/candidates?page=1&pageSize=25", "GET placement candidates");
  apiGet("/placement-cell-applications/portal/opportunities?page=1&pageSize=20", "GET placement opportunities");
  apiGet("/placement-cell-applications/portal/applications?page=1&pageSize=30", "GET placement applications");
  sleep(0.1);
}

export function technicalReads() {
  if (!technicalLogin()) return sleep(1);
  apiGet("/technical-institute-applications/portal/profile", "GET technical profile");
  apiGet("/technical-institute-applications/portal/dashboard", "GET technical dashboard");
  apiGet("/technical-institute-applications/portal/students?page=1&pageSize=25", "GET technical students");
  apiGet("/technical-institute-applications/portal/opportunities?page=1&pageSize=20", "GET technical opportunities");
  sleep(0.1);
}

export function adminReads() {
  const headers = { Cookie: __ENV.LOAD_ADMIN_COOKIE };
  apiGet("/admin/overview", "GET admin overview", headers);
  apiGet("/admin/requirements?page=1&pageSize=20", "GET admin requirements", headers);
  apiGet("/admin/system/metrics", "GET admin metrics", headers);
  sleep(0.1);
}

export function chatbotTraffic() {
  const response = http.post(`${API}/chatbot/messages`, JSON.stringify({ message: "What services does ZOBHUNGER provide?", history: [], currentPage: "/" }), {
    headers: { "Content-Type": "application/json" },
    tags: { name: "POST chatbot message" },
    timeout: "30s",
  });
  good(response, 200, "POST chatbot message");
  sleep(1);
}

export function paymentRefresh() {
  const token = encodeURIComponent(__ENV.LOAD_PAYMENT_CHECKOUT_TOKEN);
  const response = http.post(`${API}/internship-payments/checkout/${token}/refresh`, null, { tags: { name: "POST payment refresh" }, timeout: "15s" });
  good(response, 200, "POST payment refresh");
  sleep(1);
}

const TEST_PDF = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\n%%EOF";
export function resumeUpload() {
  if (!workerLogin()) return sleep(1);
  const profileResponse = apiGet("/workers/profile", "GET worker profile for upload");
  if (profileResponse.status !== 200) return;
  let payload;
  try { payload = profileResponse.json(); } catch { functionalFailure.add(true, { endpoint: "resume upload profile parse" }); return; }
  const revision = payload?.data?.profile?.resumeRevision;
  if (!Number.isInteger(revision)) {
    functionalFailure.add(true, { endpoint: "resume upload revision" });
    return;
  }
  const response = http.put(`${API}/workers/profile/resume`, TEST_PDF, {
    headers: {
      "Content-Type": "application/pdf",
      "X-File-Name": "load-test-resume.pdf",
      "X-Resume-Revision": String(revision),
      "X-Requested-With": "XMLHttpRequest",
      ...(ORIGIN ? { Origin: ORIGIN } : {}),
    },
    tags: { name: "PUT worker resume" },
    timeout: "60s",
  });
  good(response, 200, "PUT worker resume");
  sleep(1);
}

export function handleSummary(data) {
  return {
    [__ENV.LOAD_SUMMARY_PATH || "load-test-summary.json"]: JSON.stringify(data, null, 2),
    stdout: `\nLoad test complete (${PROFILE}). Detailed JSON: ${__ENV.LOAD_SUMMARY_PATH || "load-test-summary.json"}\n`,
  };
}
