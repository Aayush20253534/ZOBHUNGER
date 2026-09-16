# Health and Observability

## Health surfaces

### Public/minimal
`/api/v1/health`, `/api/v1/health/ready`, `/route`, `/ready` provide deployment/liveness/readiness signals without exposing detailed provider configuration.

### Protected admin
`/api/v1/admin/system/health` contains richer diagnostics and `/api/v1/admin/system/metrics` exposes bounded operational request/operation metrics. These endpoints require normal admin security controls.

## HTTP metrics

The backend records request counts, active/aborted requests, 5xx results and latency buckets. Slow requests crossing `SLOW_REQUEST_MS` generate warning diagnostics.

## Operation metrics

Heavy/internal operations can record bounded timing/count information separately from generic HTTP metrics so slow provider/export/matching work can be identified.

## Logs

Logs are structured JSON with request IDs and redaction. Platform log access should still be restricted because even sanitized operational logs can reveal business behavior/timing.

## External monitoring

`ERROR_MONITORING_WEBHOOK_URL` can forward sanitized application error events. The webhook has its own token/timeout. An outage of the monitoring service must not recursively crash the application.

## Uptime monitoring

Point external uptime monitoring at minimal health/readiness routes rather than protected internal diagnostic endpoints. Alert on sustained readiness failures, 5xx rates and latency degradation rather than a single transient request.
