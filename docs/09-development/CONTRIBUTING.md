# Contributing

## Branch/change discipline

Keep feature changes cohesive: backend schema/service/API, frontend UI/types and tests should land together when they form one behavior change.

## Before coding

1. identify the owning domain module;
2. check its role/permission boundary;
3. check whether the dataset requires pagination/caps;
4. identify private/sensitive data and external providers;
5. read the relevant feature/security document.

## Implementation rules

- never bypass shared API transport with an unbounded raw `fetch()` without a concrete reason;
- never add an admin route without permission mapping/tests;
- never put secrets in client env or logs;
- never fetch an unbounded roster/table for a dropdown;
- preserve idempotency/revision logic on mutating workflows;
- use private storage for private documents;
- update tests and docs with behavior changes.

## Verification

Run focused tests while iterating, then:

```bash
npm run verify
```

If a provider/live environment is required, state what was not verified rather than representing a static test as production evidence.

## Documentation

Update the current-state document for the domain. Do **not** add `PART_7`, `PHASE_4`, “implementation patch” or dated handoff notes under `docs/`. Git history already records chronology; documentation should explain the system someone has to operate today.
