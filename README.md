# Ticketing System

A Kanban-style ticket tracker built as a three-tier single-page application.

- **Frontend** — React + TypeScript + Vite (served by nginx in production)
- **Backend** — Node.js + TypeScript + Fastify, exposing an HTTP API
- **Database** — PostgreSQL, with schema managed by Prisma migrations

See [`PLAN.md`](./PLAN.md) for the full architecture and build plan.

## Prerequisites

- **Docker** and **Docker Compose** — the only host requirement.
  No local Node.js, database, or other runtime is needed to run the app.

## Quick start

From the repository root:

```bash
cp .env.example .env      # optional; sensible defaults are baked in
docker compose up --build
```

Then open:

| Service            | URL                          |
| ------------------ | ---------------------------- |
| Web app (SPA)      | http://localhost:8080        |
| API (direct)       | http://localhost:3000/health |
| MailHog (dev SMTP) | http://localhost:8025        |

The API applies database migrations automatically on startup, then begins
serving. A freshly started database contains only the schema and migration
metadata — no seed or sample data. All test data is created through the UI/API.

## Email verification in dev

In development, **no real email is sent** — all outgoing mail is captured by the
**MailHog** container, not delivered to real inboxes. So after signing up at
http://localhost:8080/signup you won't receive anything in your actual mailbox.

To verify a dev account, open the **MailHog inbox at http://localhost:8025**,
click the “Verify your Ticket Tracker account” message, and follow the link
inside — then log in. Verification links are single-use and expire in 24 hours,
and each resend/re-signup invalidates earlier links, so always use the newest
message.

## Configuration

All configuration is via environment variables (see `.env.example`). Secrets are
never committed; copy `.env.example` to `.env` and adjust.

| Variable                                   | Purpose                                        | Default                |
| ------------------------------------------ | ---------------------------------------------- | ---------------------- |
| `POSTGRES_USER` / `_PASSWORD` / `_DB`      | PostgreSQL credentials and database name       | `ticketing`            |
| `JWT_SECRET`                               | Secret for signing auth tokens                 | dev placeholder        |
| `APP_BASE_URL`                             | Base URL used in email-verification links      | `http://localhost:8080`|
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_FROM`    | Outgoing mail. Dev uses the `mailhog` container | `mailhog:1025`        |

> For QA/production email, set `SMTP_HOST=relay1.dataart.com` and the appropriate port.

## Technology choices

Each tool is chosen for a specific job:

| Technology | Where | Purpose |
| ---------- | ----- | ------- |
| **React + TypeScript** | `web/` | SPA UI, fully typed |
| **Vite** | `web/` | Dev server (HMR) + production bundler |
| **Tailwind CSS** | `web/` | Styling; shared class tokens in `src/lib/ui.ts` keep it consistent without a component library |
| **TanStack Query** | `web/` | Server-state cache, loading/empty/error states, and optimistic drag-drop with rollback. The DB is the source of truth — server data is never mirrored into a client store |
| **React Router** | `web/` | Client-side routing + the protected-route guard |
| **@dnd-kit/core** | `web/` | Accessible (pointer **and** keyboard) drag-and-drop for the Kanban board |
| **Node.js + TypeScript** | `api/` | Backend runtime, fully typed |
| **Fastify** | `api/` | HTTP server, routing, and a single error handler that renders a consistent `{ error: { code, message } }` envelope |
| **Zod** | `api/` | Request validation at the route boundary; server-side validation is authoritative |
| **Prisma** | `api/` | Type-safe DB access + schema/migrations (`prisma/schema.prisma`) |
| **PostgreSQL** | `db` | Relational store; referential integrity (FK `RESTRICT`/`CASCADE`) backs the delete/conflict rules |
| **Argon2id** | `api/` | Password hashing |
| **JSON Web Tokens** | `api/` | Stateless bearer auth; the token is the only thing kept in `localStorage` |
| **Nodemailer + MailHog** | `api/` + `mailhog` | Email verification; MailHog catches all dev mail (see above) |
| **Vitest** | `api/` | Backend integration tests against a dedicated test database |
| **nginx** | `web/` (prod image) | Serves the built SPA and proxies `/api` to the backend |
| **Docker Compose** | root | One-command orchestration of db + api + web + mailhog |

## Project layout

```
.
├── docker-compose.yml     # db + api + web (+ mailhog) — one command starts everything
├── .env.example           # configuration template (no secrets committed)
├── PLAN.md                # architecture & implementation plan
├── api/                   # backend: Fastify + Prisma
│   ├── src/               # server + business logic
│   └── prisma/            # schema + migrations
└── web/                   # frontend: React + Vite SPA (nginx-served)
    └── src/
```

## Local development (per tier, without full Docker)

`docker compose up --build` is the simplest way to run everything. For faster
iteration on a single tier, run it directly with Vite/tsx hot-reload. Requires
**Node.js 22+**.

You still need a database. The easiest option is to run just the Postgres
container from the compose file and point the API at it:

```bash
docker compose up -d db        # Postgres on localhost:5432 (+ mailhog for email)
docker compose up -d mailhog
```

**Backend** (`api/`):

```bash
cd api
npm install
cp ../.env.example .env                 # or export the vars below
npx prisma generate                     # generate the Prisma client
npx prisma migrate deploy               # apply migrations to the database
npm run dev                             # tsx watch — API on http://localhost:3000
```

Key env vars for local runs (see `.env.example` for the full list):
`DATABASE_URL`, `JWT_SECRET`, `APP_BASE_URL`, `SMTP_HOST`/`SMTP_PORT`.

**Frontend** (`web/`):

```bash
cd web
npm install
npm run dev                             # Vite on http://localhost:5173, proxies /api → :3000
```

> Changes are live in the dev servers immediately. But the **Docker images do
> not rebuild on their own** — after merging new work, run
> `docker compose up -d --build` to see it at http://localhost:8080.

## Tests

```bash
cd api && npm test    # backend — Vitest integration tests (needs the db container running)
```

The backend suite spins up a dedicated `ticketing_test` database and exercises
the HTTP API end to end (auth, teams, epics, tickets, comments).

> **Frontend tests are not set up yet** (`web`'s `npm test` currently has no
> runner). Adding Vitest + React Testing Library is the remaining Milestone 7
> work.

## Adding a new feature

The codebase follows a consistent layering. Adding, say, a new resource or
field means touching the same files in the same order.

**Backend (`api/src/`)** — build outward from the data:

1. **Schema change?** Edit `prisma/schema.prisma`, then
   `npx prisma migrate dev --name <change>` to create + apply a migration and
   regenerate the client. Migrations are committed and run automatically on
   container start.
2. **Validation** — add a Zod schema in `schemas/` for the request body/query.
   Server-side validation is authoritative.
3. **Business logic** — add a function in `services/`. Keep DB access and rules
   here; translate Prisma errors into `AppError`s (`badRequest`, `notFound`,
   `conflict`, …) so the error envelope stays consistent.
4. **Route** — add the handler in `routes/`, parse input with the Zod schema,
   call the service, and register the route plugin in `app.ts` (guard it with
   `authGuard` unless it's public).
5. **Test** — add a Vitest file in `tests/` that drives the new endpoint via
   `app.inject` (the HTTP seam), following the existing tests.

**Frontend (`web/src/`)** — build inward from the API:

1. **API client** — add typed functions in `api/` using the `apiFetch` wrapper
   (mirrors `api/tickets.ts`).
2. **Data** — call them with TanStack Query (`useQuery`/`useMutation`), and
   `invalidateQueries` on mutation. Derive view state with `useMemo`; don't copy
   server data into local state.
3. **UI** — build with the shared class tokens in `lib/ui.ts` and the shared
   components (`Modal`, `Toast`, `EmptyState`, `ErrorState`, `Skeleton`,
   `Badge`). Cover loading / empty / success / validation / error states, and
   keep forms/dialogs accessible (labels, `role="alert"`, focus handling).
4. **Route** — add it in `App.tsx` (wrap in `ProtectedRoute` if it needs auth)
   and, if it's a top-level destination, add a link in `AppHeader`.

**Workflow:** branch off `main` → implement → `npm run build` (typecheck +
bundle) and `npm test` (backend) → run the app and verify the change end to end
→ open a PR into `main`. After merging, `docker compose up -d --build` to see it
in the running app.

## Implementation status

- [x] **Milestone 1** — scaffold, Docker Compose, database schema + migrations, health endpoints
- [x] **Milestone 2** — authentication & email verification
- [x] **Milestone 3** — teams & epics
- [x] **Milestone 4** — tickets & comments
- [x] **Milestone 5** — Kanban board (drag & drop)
- [x] **Milestone 6** — screen polish & UX states
- [ ] Milestone 7 — automated tests & docs _(docs done; frontend test runner pending)_
