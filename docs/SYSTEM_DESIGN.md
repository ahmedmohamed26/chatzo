# AI Conversations - MVP System Design

## 1) Full System Architecture
- Frontend: Angular app with onboarding, inbox, settings, i18n and RTL switching.
- Backend: NestJS modular monolith with tenant-aware modules and API prefix `/api/v1`.
- Database: PostgreSQL with strict `tenant_id` on business tables.
- Integration: WhatsApp OAuth starter endpoint + webhook receiver endpoint.
- AI is intentionally disabled in MVP and deferred to Phase 2.
- Future AI boundary is preserved via the `automation` module interface, but it is not wired at runtime.

## 2) Auth & Subscription Design
- Auth: Email/password, JWT-ready controller contracts, RBAC role model.
- Roles: `super_admin`, `company_admin`, `agent`.
- Tenant isolation: request-level tenant guard using token tenant and `x-tenant-id`.
- Plans: `free`, `pro`, `business` in `plans` table.
- Subscription lifecycle table: `subscriptions`.
- Usage counters per period in `usage_tracking`.
- Plan enforcement entry-point via `PlanGuard` scaffold.

## 3) Wizard UX Flow
- Step 1: Company setup
- Step 2: Connect WhatsApp
- Step 3: Invite team
- Step 4: Create quick replies
- Step 5: Go to inbox
- Frontend has progress indicator, local persistence for resume, and bilingual labels.

## 4) i18n Implementation
- Frontend translation files: `frontend/src/assets/i18n/en.json`, `frontend/src/assets/i18n/ar.json`.
- Runtime language switch in sidebar.
- Dynamic `dir` switch between `ltr` and `rtl`.
- Backend responses include `message_key` and `message` to support localization strategy.

## 5) Database Schema
- `tenants`, `users`, `roles`, `plans`, `subscriptions`, `usage_tracking`, `channels`,
  `conversations`, `messages`, `quick_replies`.
- `users.preferred_language` included.
- Seeded plans and roles.

## 6) API Structure
- Auth: `/auth/register`, `/auth/login`
- User: `/me`, `/me/language`
- Plans/Subscription: `/plans`, `/subscription`, `/subscription/upgrade`, `/subscription/downgrade`
- Onboarding: `/onboarding/state`, `/onboarding/step/:step/complete`, `/onboarding/resume`
- Channels: `/channels`, `/channels/whatsapp/oauth/start`
- Inbox: `/conversations`, `/conversations/:id`, `/conversations/:id/messages`, status + assignment routes
- Quick replies: `/quick-replies`
- Webhooks: `/webhooks/whatsapp`

## 7) Docker Setup
- Single command: `docker compose up --build`
- Services: `postgres`, `backend`, `frontend`

## 8) MVP Roadmap
1. Replace mocked controllers with real services + repositories.
2. Implement JWT issuance/refresh + password hashing.
3. Add TypeORM/Prisma migrations and production-safe schema management.
4. Integrate real WhatsApp provider OAuth/webhooks.
5. Add billing provider and real plan enforcement.
6. Add tests (unit + e2e + tenant isolation and RBAC).
7. Add observability (structured logs, traces, metrics).

## 9) Monetization Strategy
- Free for activation.
- Pro as default paid tier.
- Business for scale and analytics.
- Core MRR levers: agent seats, WhatsApp numbers, advanced analytics add-ons.
- Retention: onboarding completion focus, usage-based upgrade nudges, downgrade save flow.
