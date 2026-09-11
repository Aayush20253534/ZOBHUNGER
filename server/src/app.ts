import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { corsOptions } from "./config/cors.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { requestContext } from "./middlewares/request-context.middleware.js";
import { notFoundHandler } from "./middlewares/not-found.middleware.js";
import { apiRouter } from "./routes/index.js";
import { getHealth, getMonitoringStatus, getReadiness } from "./controllers/health.controller.js";
import { apiRateLimiter } from "./middlewares/rate-limit.middleware.js";

export const app = express();

app.disable("x-powered-by");
if (env.TRUST_PROXY) app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "same-site" },
  }),
);
app.use(requestContext);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true, limit: "64kb" }));

// Health/readiness stay outside the global API limiter so platform probes cannot
// accidentally rate-limit the service out of rotation.
app.get("/api/v1/health", getHealth);
app.get("/api/v1/health/ready", getReadiness);
app.use("/api/v1", apiRateLimiter, apiRouter);
app.get(["/", "/route"], getMonitoringStatus);
app.get("/ready", getReadiness);
app.use(notFoundHandler);
app.use(errorHandler);
