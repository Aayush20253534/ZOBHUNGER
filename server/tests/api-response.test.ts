import assert from "node:assert/strict";
import test from "node:test";
import { apiErrorResponse, apiSuccessResponse } from "../src/utils/api-response.js";

test("success response uses the stable Phase 1 envelope", () => {
  assert.deepEqual(apiSuccessResponse("Saved", { id: "abc" }), {
    success: true,
    message: "Saved",
    data: { id: "abc" },
  });
});

test("error response includes machine-readable error details when provided", () => {
  assert.deepEqual(apiErrorResponse("Not found", { code: "JOB_NOT_FOUND" }), {
    success: false,
    message: "Not found",
    error: { code: "JOB_NOT_FOUND" },
  });
});
