# Performance and Load Testing

## k6 suite

Load scenarios live under `load-tests/k6/` and are invoked by root scripts:

```bash
npm run load:smoke
npm run load:test
```

Set `LOAD_BASE_URL` to the target API environment.

## Covered surfaces

The suite includes representative reads for business dashboard/attendance, worker dashboard, placement candidates, technical opportunities and admin metrics. Optional scenarios can exercise chatbot/provider traffic, payment refresh and resume upload.

## Safety acknowledgements

Expensive provider traffic and mutating upload scenarios require explicit environment acknowledgements (`LOAD_CONFIRM_PROVIDER_TRAFFIC`, `LOAD_MUTATION_ACK`) so an engineer does not accidentally generate provider spend or persistent test data by running a default smoke test.

## Default objective

The checked-in k6 thresholds include a p95 latency target and failure-rate expectations. Treat them as a regression gate, not a universal capacity guarantee.

## Production-like test requirements

Use:

- a disposable/staging PostgreSQL database with production-like schema/indexes;
- Redis configured the way production will use it;
- representative dataset sizes;
- isolated test accounts;
- known provider/sandbox settings.

Observe p95/p99, throughput, 4xx/5xx mix, database pool saturation, slow queries, CPU/memory, Redis timeouts and provider circuit/budget behavior.
