# Enterprise Secrets Governance (SECRETS.md)

This document serves as the central registry for all secrets, credentials, and sensitive configuration required by the Novocrypt repository.

## Secret Ownership Matrix

| Secret Variable | Owner | Storage Location | Rotation Cadence | Prod Usage |
| :--- | :--- | :--- | :--- | :--- |
| `POSTGRES_PASSWORD` | Infrastructure | Runtime Env / Cloud Secret Manager | 90 Days | Yes |
| `DATABASE_URL` | Backend | Runtime Env | 90 Days (Tied to DB) | Yes |
| `JWT_SECRET` | Backend Security | Runtime Env | 90 Days | Yes |
| `OPENAI_API_KEY` | AI Feature Team | Runtime Env / GitHub Secrets | 180 Days | Yes |
| `SMTP_PASS` | Notification Services | Runtime Env / GitHub Secrets | 180 Days | Yes |
| `TURNSTILE_SECRET_KEY` | Frontend Security | Runtime Env | 365 Days | Yes |
| `NEWSAPI_KEY` | Threat Intel | Runtime Env | 365 Days | Yes |

## Infrastructure & GitHub

| Secret Variable | Owner | Storage Location | Rotation Cadence | Prod Usage |
| :--- | :--- | :--- | :--- | :--- |
| `RENOVATE_TOKEN` | DevSecOps | GitHub Secrets | 365 Days | CI Only |
| `GITHUB_TOKEN` | DevSecOps | GitHub Automatically Provisioned | Ephemeral | CI Only |

## Validation Policy

All required runtime secrets **MUST** be mocked and documented in `backend/.env.example`. This file serves as the definitive configuration contract for the repository. Pull Requests introducing new variables without updating the `.env.example` contract will be rejected.
