# Contributing to NovoCrypt

Thank you for your interest in contributing to NovoCrypt! This guide will help you set up your development environment, understand our coding standards, and follow the contribution workflow.

---

## 1. Development Setup

### Prerequisites
- **Node.js**: Version 18.x or 20.x (v20.x recommended)
- **TypeScript**: Version 5.x
- **Docker**: For running PostgreSQL database and Redis services (only needed for frontend/backend API server scans)

### Getting Started
1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/novocrypt.git
   cd novocrypt
   ```

2. **Install dependencies in the backend package:**
   ```bash
   cd backend
   npm install
   ```

3. **Verify type safety and linting:**
   ```bash
   npx tsc --noEmit
   npm run lint
   ```

---

## 2. Coding Standards

We enforce the following guidelines to maintain a clean and maintainable codebase:
- **TypeScript Strict Mode**: Avoid using `any` type annotations. Explicitly type all variables, method parameters, and return types.
- **Detector Abstractions**: Custom detectors MUST inherit from [BaseDetector](file:///d:/Desktop/PQC/backend/src/services/scanner/framework/BaseDetector.ts) and implement the `executeDetection` signature.
- **Regular Expressions**: All regular expression patterns MUST be linear-time ($O(N)$) and verified against catastrophic backtracking (ReDoS).
- **Line and File Limits**: Sub-analyzers must respect target size bounds ($100\text{ KB}$ max file size, $8,192$ character line cap).
- **Early Abort**: Line loops must use `for` loops with `if (findings.length >= maxLimit) break;` checks to prevent CPU resource exhaustion.

---

## 3. Testing Requirements

We maintain a strict regression policy. Any new feature, bug fix, or detector MUST include a corresponding test script.

- **Running Tests**:
  ```bash
  npm test
  ```
- **Adding Tests**: Add test assertions in the corresponding `backend/scripts/test-<name>-detector.ts` file, or create a new test file under `scripts/`.
- **Test Expectations**: All tests must run headlessly, execute within performance budgets ($< 200\text{ ms}$ per script), and compile with zero compiler warnings.

---

## 4. Git and Commit Conventions

### Branch Naming
- Features: `feat/description-name`
- Bug Fixes: `fix/bug-description`
- Performance/Refactoring: `perf/description` or `refactor/description`
- Documentation: `docs/description`

### Commit Message Format
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
```
<type>(<scope>): <short summary>

[optional body description]
```
**Examples:**
- `feat(scanner): add ssh-rsa and legacy key detector`
- `fix(jwt): resolve crash when decoding empty signature segments`
- `perf(aes): implement early loop abort for findings limit guard`

---

## 5. Pull Request (PR) Process

1. **Create a local branch** and write clean, fully-typed code with passing unit/regression tests.
2. **Execute build validations** locally:
   ```bash
   npx tsc --noEmit
   npm test
   ```
3. **Submit the PR** targeting the `main` branch.
4. **Code Review**: At least one maintainer must review and approve the PR before merge. Ensure all automated CI checks pass successfully.
