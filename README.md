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

## Local development (without Docker)

Optional — for iterating on a single tier. Requires Node.js 22+ and a reachable
PostgreSQL instance.

```bash
# Backend
cd api && npm install && npm run dev

# Frontend (in another terminal) — proxies /api to http://localhost:3000
cd web && npm install && npm run dev
```

## Tests

```bash
cd api && npm test    # backend
cd web && npm test    # frontend
```

## Implementation status

- [x] **Milestone 1** — scaffold, Docker Compose, database schema + migrations, health endpoints
- [x] **Milestone 2** — authentication & email verification
- [x] **Milestone 3** — teams & epics
- [x] **Milestone 4** — tickets & comments
- [ ] Milestone 5 — Kanban board (drag & drop)
- [ ] Milestone 6 — screen polish & UX states
- [ ] Milestone 7 — automated tests & docs
