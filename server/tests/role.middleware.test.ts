import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Request, Response } from "express";
import { requireRole } from "../src/middlewares/role.middleware.js";
import { HttpError } from "../src/utils/http-error.js";

function run(role?: "ADMIN" | "BUSINESS" | "WORKER") {
  const middleware = requireRole("ADMIN");
  let received: unknown;
  let called = false;
  const res = { locals: role ? { authUser: { role } } : {} } as Response;
  const next: NextFunction = (error?: unknown) => {
    called = true;
    received = error;
  };

  middleware({} as Request, res, next);
  return { called, received };
}

test("ADMIN passes ADMIN role guard", () => {
  const result = run("ADMIN");
  assert.equal(result.called, true);
  assert.equal(result.received, undefined);
});

test("BUSINESS is forbidden from ADMIN routes", () => {
  const result = run("BUSINESS");
  assert.ok(result.received instanceof HttpError);
  assert.equal((result.received as HttpError).statusCode, 403);
});

test("missing authenticated user is unauthorized", () => {
  const result = run();
  assert.ok(result.received instanceof HttpError);
  assert.equal((result.received as HttpError).statusCode, 401);
});
