# Enterprise Testing Automation (PATCH-09)

This document dictates the official testing standards, mocking policies, and coverage constraints for the NovoCrypt platform.

## Testing Philosophy
Our goal is **engineering confidence**. The CI pipeline must provide a 100% guarantee that a pull request does not violate existing business logic or HTTP contracts.

## Repository Structure
```
tests/
├── unit/            # Isolated tests (No DB/Network) (*.unit.test.ts)
├── integration/     # Database-reliant tests (*.integration.test.ts)
├── contract/        # HTTP interface tests (*.contract.test.ts)
├── factories/       # @faker-js/faker data generators
├── fixtures/        # Static JSON responses
├── mocks/           # Complex dependency mocks
└── setup.ts         # Global test hooks (DB cleanup, mock initialization)
```

## Coverage Policy (V8)
Coverage is non-negotiable and strictly enforced during CI/CD.
*   **Global Target:** 80% (Lines, Branches, Statements).
*   **Critical Security Modules:** 100% (e.g. `auth.controller.ts`, `auth.middleware.ts`).
*   **New Features:** 100%. All new PRs must maintain or improve overall coverage.

## Mocking Policy
*   **ALWAYS MOCK:** Redis (`ioredis-mock`), SMTP, External APIs (Nock/MSW), Time (`vi.useFakeTimers`), Telemetry (Pino/Prometheus).
*   **NEVER MOCK:** Prisma Database (during Integration Tests). Do not mock the ORM. We use a dedicated PostgreSQL Test Container to execute real transactions.

## Database Strategy
*   Integration tests execute against a dedicated, real PostgreSQL instance.
*   `tests/setup.ts` utilizes `TRUNCATE TABLE` between test suites to ensure absolute determinism and repeatable execution speed.

## Running Tests
*   `npm run test` (Run all tests)
*   `npm run test:unit` (Run isolated unit tests)
*   `npm run test:integration` (Run DB integration tests - ensure DB is running)
*   `npm run test:contract` (Run HTTP contract tests)
*   `npm run test:coverage` (Generate coverage reports)
