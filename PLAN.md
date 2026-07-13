# Ticketing System — Implementation Plan

Based on the Hackathon Ticketing System Requirements. Stack: **Node.js + TypeScript** backend, **React + TypeScript + Vite** frontend, **PostgreSQL** database.

## 1. Architecture (three logical tiers)

```
┌──────────────────┐     HTTP/JSON      ┌──────────────────┐    SQL/TCP    ┌──────────────┐
│  Presentation    │ ─────────────────> │  Application/API │ ────────────> │ Persistence  │
│  React SPA       │ <───────────────── │  Node + Fastify  │ <──────────── │ PostgreSQL   │
│  (Vite, nginx)   │                    │  (business logic)│               │  (RDBMS)     │
└──────────────────┘                    └──────────────────┘               └──────────────┘
     container: web                        container: api                   container: db
                        + container: mailhog (dev SMTP capture / relay config)
```

Three containers in `docker-compose.yml` at repo root: `web`, `api`, `db` (plus an optional `mailhog` for local email capture). `docker compose up --build` brings up the whole thing from a clean checkout — no host runtimes required.

## 2. Technology Stack

| Concern | Choice | Why |
|---|---|---|
| **Backend runtime** | Node.js 22 LTS + TypeScript | One language end-to-end |
| **HTTP framework** | **Fastify** | Fast, first-class TS, built-in JSON-schema validation |
| **ORM + migrations** | **Prisma** | Type-safe queries; `prisma migrate` gives automated, repeatable schema init |
| **DB** | **PostgreSQL 16** (official container) | Required server-based RDBMS |
| **Password hashing** | **`@node-rs/argon2`** (Argon2id) | Explicitly recommended by spec |
| **Auth** | **JWT bearer tokens** in `Authorization` header | Spec allows bearer or cookie; keeps tokens out of URLs |
| **Email/SMTP** | **Nodemailer** | Configurable SMTP host — `relay1.dataart.com` in prod, MailHog in dev |
| **Validation (shared)** | **Zod** + `fastify-type-provider-zod` | Reuse schemas both tiers; server is source of truth |
| **Backend tests** | **Vitest** + Supertest + dockerized test DB | Covers ≥1 backend business flow |
| **Frontend** | **React 18 + TypeScript + Vite** | SPA |
| **Server state** | **TanStack Query (React Query)** | Caching, loading/error/empty states, optimistic drag + rollback |
| **Routing** | **React Router** | SPA screens |
| **Drag & drop** | **@dnd-kit** | Accessible, performant Kanban DnD |
| **Forms** | **React Hook Form + Zod** | Client validation (server still authoritative) |
| **Styling** | **Tailwind CSS** | Fast to match the clean wireframe look |
| **Frontend tests** | **Vitest + React Testing Library** (+ optional Playwright) | Covers ≥1 frontend/API flow |
| **Prod serving** | **nginx** serving Vite build, proxying `/api` → api container | Static assets public; API guarded |

## 3. Database Schema (PostgreSQL, via Prisma migrations)

```
users
  id            uuid  PK
  email         text  UNIQUE (stored lowercased+trimmed)  NOT NULL
  password_hash text  NOT NULL          -- Argon2id
  is_verified   bool  NOT NULL default false
  created_at    timestamptz
  modified_at   timestamptz

email_verification_tokens
  id          uuid PK
  user_id     uuid FK -> users
  token_hash  text NOT NULL             -- store hash of token, not raw
  expires_at  timestamptz NOT NULL      -- created + 24h
  consumed_at timestamptz NULL          -- single-use
  -- new token issuance invalidates prior unused tokens (delete/expire)

teams
  id          uuid PK
  name        text NOT NULL             -- unique case-insensitive (functional index on lower(name))
  created_at  timestamptz
  modified_at timestamptz

epics
  id          uuid PK
  team_id     uuid FK -> teams (RESTRICT on delete)   -- immutable after create
  title       text NOT NULL
  description text NULL
  created_at  timestamptz
  modified_at timestamptz

tickets
  id          uuid PK
  team_id     uuid FK -> teams (RESTRICT)
  epic_id     uuid FK -> epics NULL (RESTRICT)         -- must be same team as ticket (enforced in service)
  type        enum('bug','feature','fix')
  state       enum('new','ready_for_implementation','in_progress','ready_for_acceptance','done')
  title       text NOT NULL
  body        text NOT NULL
  created_by  uuid FK -> users
  created_at  timestamptz
  modified_at timestamptz                              -- advances only on real field/state change

comments
  id          uuid PK
  ticket_id   uuid FK -> tickets (CASCADE on ticket delete)
  author_id   uuid FK -> users
  body        text NOT NULL
  created_at  timestamptz
```

**Referential-integrity rules** enforced by FK `RESTRICT` + service checks → deleting a team with tickets/epics, or an epic with tickets, returns **HTTP 409**. Deleting a ticket cascades to its comments only. Fresh DB after migration = schema + migration metadata only, **no seed data**.

## 4. Backend Plan

**Project layout** (`/api`): `src/routes`, `src/services` (business logic), `src/db` (Prisma client), `src/auth`, `src/email`, `src/schemas` (Zod), `prisma/schema.prisma`, `prisma/migrations`, `tests`.

**API endpoints** (all require auth except the four public auth routes):

```
Public:
  POST /auth/signup              -- create user, send verification email
  POST /auth/login               -- returns bearer token (only if verified)
  GET  /auth/verify?token=...    -- single-use, 24h, → "verified" result
  POST /auth/resend-verification -- invalidates prior unused tokens
  GET  /health                   -- public readiness

Authenticated:
  GET/POST                 /teams
  GET/PATCH/DELETE         /teams/:id           -- DELETE → 409 if referenced
  GET/POST                 /epics?teamId=        (create)
  GET/PATCH/DELETE         /epics/:id            -- DELETE → 409 if referenced
  GET/POST                 /tickets?teamId=&type=&epicId=&search=
  GET/PATCH/DELETE         /tickets/:id          -- PATCH state = drag persist
  GET/POST                 /tickets/:id/comments -- oldest-first
  GET  /me                                       -- current user
```

**Key business logic (server-authoritative):**
- Email normalization (trim + lowercase) + uniqueness before insert.
- Argon2id hash on signup; verify on login; block login until `is_verified`.
- Verification token: random, hashed at rest, 24h TTL, single-use, reissue invalidates old.
- Ticket↔epic same-team validation on create/update; on team change, reject mismatched epic.
- `modified_at` advances **only** when a field/state actually changes (compare before write); adding a comment never touches it.
- Enum validation for `type`/`state` via Zod (reject unknown values).
- Consistent error envelope + status codes: 400/422 validation, 401 auth, 404 missing, 409 conflict.

**Migrations:** `prisma migrate deploy` runs automatically on api container start (entrypoint), before the server listens.

**Backend test (DoD):** integration test of the ticket lifecycle — create team → create epic → create ticket → change state → assert `modified_at` advanced + comment does not advance it → delete team returns 409.

## 5. Frontend Plan

**Project layout** (`/web`): `src/pages`, `src/components`, `src/api` (typed React Query hooks), `src/lib` (auth token, fetch wrapper), `src/types`.

**Screens (maps to §10 Minimum Screens + wireframes):**

| Route | Screen | Notes |
|---|---|---|
| `/signup` | Create account | email, password (≥8), confirm |
| `/login` | Log in | + "Resend email" for unverified |
| `/verify` | Email verification result | success / expired-or-invalid + resend action |
| `/` (board) | **Kanban board** (primary) | team selector, 5 columns, DnD, filters, search, New ticket |
| `/tickets/:id` | Ticket details/edit | all fields + comments panel, Save/Delete |
| `/teams` | Team management | list w/ counts, create/rename, delete disabled when referenced |
| `/epics` | Epic management | per-team list, CRUD, delete disabled when referenced |

**Kanban specifics:**
- 5 fixed columns in workflow order; human-readable labels (e.g. "Ready for implementation").
- Cards show title + type badge (+ epic, recommended).
- Within a column: sort by `modified_at` desc.
- Drag → optimistic move via React Query, `PATCH /tickets/:id` state; **on failure, roll back card to previous column + show error toast**.
- Filters (type, epic) + case-insensitive title search, combined with AND. Usable at 100+ tickets (server-side filter query keeps it light).

**Cross-cutting UX (§11):** loading / empty / success / error states everywhere via React Query statuses; auth guard redirects unauthenticated users to `/login`; token stored in memory (DB is the system of record, not local storage).

**Frontend test (DoD):** RTL test of board rendering + a drag/state-change flow (or a Playwright happy-path: login → board → move card → persists after reload).

## 6. Docker & Config

- **Root `docker-compose.yml`**: `db` (postgres:16, named volume for persistence), `api` (multi-stage Node build, waits for db healthcheck, runs migrations then starts), `web` (multi-stage: Vite build → nginx), `mailhog` (dev SMTP UI at :8025).
- **Config via env vars only** (no secrets in git): `DATABASE_URL`, `JWT_SECRET`, `SMTP_HOST` (=`relay1.dataart.com` in prod / `mailhog` in dev), `SMTP_PORT`, `APP_BASE_URL` (for verification links). Ship a `.env.example`; real `.env` gitignored.
- **Reliability:** postgres named volume → data survives restart/refresh.

## 7. Testing & Non-Functional
- Automated tests wired into the repo (Vitest both tiers); README documents `docker compose up --build`, prerequisites, and config.
- Security: hashed passwords, guarded endpoints, input validation, no committed secrets.
- Compatibility: current Chrome/Edge/Firefox desktop.

## 8. Suggested Build Order (milestones)

1. **Scaffold + Docker + DB** — compose file, Prisma schema, first migration, health endpoint. *(Enables `docker compose up`.)*
2. **Auth** — signup, Argon2id, email verification via SMTP/MailHog, login, JWT, guards.
3. **Teams + Epics** — CRUD + 409 delete guards + uniqueness/same-team rules.
4. **Tickets + Comments** — CRUD, `modified_at` semantics, enum/reference validation, comments.
5. **Kanban board** — columns, cards, DnD persist + rollback, filters/search.
6. **Screens polish** — team/epic management UIs, loading/empty/error states.
7. **Tests + README** — backend flow test, frontend/API flow test, docs. *(Closes DoD.)*

## 9. Requirement "gotchas" baked in
- `modified_at` must **not** advance on no-op saves or on new comments → dirty-check in the update service.
- Verification tokens: hashed at rest, single-use, 24h, reissue invalidates prior → dedicated token table.
- Delete guards return **409** (team w/ tickets/epics, epic w/ tickets) — enforced server-side, delete buttons disabled in UI.
- **No seed data** on fresh start — QA creates data via UI/API.
- Server-side validation is authoritative; client validation is UX-only.

## 10. Definition of Done — coverage map
- [ ] Sign up → verification email via SMTP → verify → log in — Milestone 2
- [ ] Teams & epics managed via UI, persisted — Milestones 3, 6
- [ ] Create/view/edit/delete tickets — Milestone 4
- [ ] Comments with author + timestamp — Milestone 4
- [ ] Kanban board shows tickets in correct state columns — Milestone 5
- [ ] Drag to another column updates server, correct after refresh — Milestone 5
- [ ] `docker compose up --build` from clean checkout — Milestone 1
- [ ] No hard-coded password or committed secret — Milestones 1, 2
- [ ] Fresh DB = schema + migration metadata only — Milestone 1
- [ ] QA creates all data via UI/API — enforced throughout
