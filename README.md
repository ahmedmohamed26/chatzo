# AI Conversations MVP

Multi-tenant, WhatsApp-first SaaS scaffold for SMB support teams.

## Stack
- Backend: NestJS
- Frontend: Angular + PrimeNG-ready UI structure
- Database: PostgreSQL
- Runtime: Docker Compose

## Run
```bash
docker compose up --build
```

## What is implemented in this scaffold
- Multi-tenant-aware backend module structure
- Auth/RBAC/plan guard skeleton
- Subscription + usage + plan endpoints
- Onboarding wizard endpoints and frontend flow
- Bilingual i18n setup (`en`/`ar`) with runtime RTL switching
- PostgreSQL schema with `tenant_id` on all business tables
- AI module is disabled in MVP (reserved for Phase 2)
