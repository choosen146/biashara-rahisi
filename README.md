# Biashara Rahisi

Biashara Rahisi ni mfumo wa usimamizi wa biashara nyingi kwa SMEs za Tanzania. Kifupi cha kiufundi cha mradi ni TBMS; jina linaloonekana kwa mtumiaji ni Biashara Rahisi. Hifadhi hii ina Angular web client, NestJS REST API, na PostgreSQL/Prisma data layer.

## Vertical slice

- Secure email/password authentication with signed JWT access tokens
- Organization membership and server-side tenant scoping
- Owner-created organization onboarding
- Dashboard summary (sales, expenses, customers, products)
- Responsive Angular starter UI with Kiswahili/English labels
- Prisma schema for organizations, memberships, products, customers, suppliers, sales, purchases, expenses, inventory movements, and audit events

## Local setup

1. Install Node.js 20+ and Docker Desktop.
2. Copy `.env.example` to `.env`.
3. Start PostgreSQL: `docker compose up -d postgres`.
4. Install dependencies: `npm install`.
5. Generate Prisma client and migrate: `npm run db:generate && npm run db:migrate`.
6. Start both apps: `npm run dev`.

Web: http://localhost:4200  |  API: http://localhost:3000/api  |  Swagger: http://localhost:3000/api/docs

The seeded demo account is `owner@tbms.local` / `ChangeMe123!` when `npm run db:seed` is run. Change it immediately in any shared environment.

To obtain a demo token for the dashboard, call `POST http://localhost:3000/api/auth/login` with `{ "email": "owner@tbms.local", "password": "ChangeMe123!" }`, then store the returned `accessToken` as `tbms_token` in browser local storage. A login screen is the next small UI slice; the API contract is already stable and documented in Swagger.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run API and web app together |
| `npm run test` | Run API unit tests |
| `npm run build` | Build API and web app |
| `npm run lint` | Lint workspaces |
| `npm run db:studio` | Open Prisma Studio |

## Architecture notes

Every request carries an authenticated user identity. `TenantGuard` resolves the active organization from the membership table and attaches `organizationId` to the request. Services require that scope for reads and writes; no controller accepts an organization ID from the browser. Financial and stock mutations are designed to run inside Prisma transactions, and money is represented as `Decimal` in the database.

## Delivery roadmap

The next vertical slices should add product/customer CRUD, purchase receipt with inventory movement, sale completion with idempotency key, and expense entry. The SRS keeps employee, service, branch, integrations, and statutory reporting work deferred to later releases.

## Verification

Run `npm run test` and `npm run build`. CI is defined in `.github/workflows/ci.yml` and runs the same checks against PostgreSQL.
