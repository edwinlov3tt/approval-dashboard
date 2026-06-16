# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Client Approval Dashboard** — a web app that gives advertisers/clients a portal to manage
campaigns, set approvers, view ads, and approve/deny/revise ad content. It shares a
PostgreSQL database with the Creative Spec App (creative-spec.vercel.app): Creative Spec
creates ads, this dashboard consumes and manages their approval.

This is an implemented, working app — not a plan. (Earlier revisions of this file described a
Next.js app in a "planning phase"; that was never built. The real stack is below.)

## Architecture

The app is two processes that run together in development:

1. **Frontend** — a Vite + React 18 single-page app (`src/`), routed with React Router v6.
   It never touches the database directly; it calls the backend over HTTP via the client in
   `src/lib/api.js` (base URL from `VITE_API_URL`, default `http://localhost:3001`).
2. **Backend** — an Express 5 JSON API (`api/`), run with `tsx` (no build step). It owns all
   database access through the shared DB library and returns JSON to the frontend.

Data flow: `React (src/) → src/lib/api.js → Express (api/) → src/lib/shared-db → PostgreSQL`.

### Tech stack (actual)
- **Frontend**: Vite 8, React 18, React Router 6, TailwindCSS 3 + plain CSS custom properties.
- **Backend**: Express 5 on Node, executed by `tsx`. No ORM — raw parameterized SQL.
- **Database**: PostgreSQL via `pg` (node-postgres), pooled. Shared with Creative Spec App.
- **Auth**: lightweight email-based login (`api/routes/auth.ts` + `src/lib/auth.jsx` Context).
  This is dev-grade, not a hardened auth system.
- **Language**: mixed. App UI is mostly `.jsx`; the API and shared DB layer are `.ts`. New
  backend / shared-db code should be TypeScript; see `tsconfig.json` (it only type-checks
  `api/**` and `src/lib/shared-db/**`).
- **Package manager**: pnpm (see `packageManager` in `package.json` and `pnpm-workspace.yaml`).

### Repository layout
```
api/                     Express API server
  index.ts               App entry: CORS, JSON, route mounting, /health, listen
  routes/                auth, campaigns, ads, approvers, profile, dashboard
src/                     Vite React SPA
  main.jsx, App.jsx      Entry + React Router routes (all protected except /login)
  pages/                 login, dashboard, ads, campaigns, calendar, profile, business-profile
  components/layout/     Layout, Sidebar, TopNav
  components/ui/          Button, Card, Modal, StatusBadge, ProgressBar, etc.
  components/preview/    Facebook/Instagram ad previews (.tsx)
  lib/api.js             Frontend HTTP client (the only way the UI reaches the backend)
  lib/auth.jsx           Auth Context (login state, ProtectedRoute)
  lib/mockData.js        Mock data still used by some pages not yet wired to the API
  lib/shared-db/         Shared PostgreSQL library (copied between apps — see below)
  styles/                variables.css (Meta design tokens), index.css, globals.css
scripts/                 DB utility scripts (check-db, check-users, create-test-user, show-schema)
context/                 Original spec + HTML prototype (historical reference)
docs/                    Database setup + integration guides
components/              STAGING ONLY: Creative Spec TSX components copied in for future reuse.
                         NOT imported by the running app. The live components are in src/components/.
```

### Shared database library (`src/lib/shared-db/`)
This folder is copied verbatim between the Creative Spec App and this app — it is the single
source of DB access. Treat it as shared code: changes here are meant to be portable to both apps.
- `db.ts` — `getPool()`, `query()`, `queryOne()`, `transaction()`, `closePool()` over a `pg.Pool`
  built from `DATABASE_URL`. All queries use parameterized SQL.
- `db-campaigns.ts`, `db-advertisers.ts`, `db-approval.ts`, `types.ts` — domain queries and types.

**Shared tables** (`ads`, `advertisers`, `approval_requests`) are owned jointly with the Creative
Spec App. Do not change their schemas without coordinating. App-specific tables (`campaigns`,
`campaign_ads`, `campaign_approvers`) are managed here. `ads.approval_status` values seen in
queries: `approved`, `denied`, `waiting`. The authoritative schema lives in
`docs/DATABASE_SCHEMA_SETUP.md`; inspect a live DB with `node scripts/show-schema.js`.

## Development

```bash
pnpm install        # install deps (pnpm; package-lock.json is intentionally gone)
pnpm dev            # runs API (tsx watch) + Vite together via concurrently
pnpm dev:api        # API only, http://localhost:3001
pnpm dev:app        # Vite only, http://localhost:5173
pnpm build          # production build of the FRONTEND only (vite build)
pnpm preview        # preview the built frontend
```

There is no build step or test suite for the API yet, and no automated tests in the repo.
`pnpm build` covers the frontend only; the API is run directly via `tsx`.

### Environment variables (`.env`, see `.env.example`)
```bash
DATABASE_URL=postgresql://user:password@host:5432/database   # shared Postgres
VITE_API_URL=http://localhost:3001                           # frontend → API base URL
API_PORT=3001                                                # API listen port
```
The API boots without `DATABASE_URL` (logs "Database: Not configured"); routes that hit the DB
will fail until it is set.

### pnpm note
pnpm blocks dependency install scripts by default as a supply-chain guard. `esbuild` is
explicitly allowed to run its install script in `pnpm-workspace.yaml` (it needs to set up its
native binary). Add new entries there only for build tools you have vetted.

## API surface

All routes are mounted directly under `/api/*` by `api/index.ts`. The frontend calls them
through `src/lib/api.js` — keep that client and the routes in sync.

- **Auth**: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me?email=`
- **Campaigns**: `GET /api/campaigns?advertiserId=`, `GET /api/campaigns/:id`,
  `GET /api/campaigns/stats`, `GET /api/campaigns/recent`, `POST /api/campaigns`,
  `PATCH /api/campaigns/:id`, `DELETE /api/campaigns/:id`
- **Ads**: `GET /api/ads?advertiserId=` (+ filters), `GET /api/ads/:id`, `GET /api/ads/stats/summary`
- **Approvers**: `GET /api/approvers?advertiserId=`, `POST /api/approvers`, `DELETE /api/approvers/:id`
- **Profile**: `GET /api/profile/company`, `GET /api/profile/approvers`, `PATCH /api/profile/company/:id`
- **Dashboard**: `GET /api/dashboard/stats`, `GET /api/dashboard/recent-activity`
- **Health**: `GET /health`

Endpoints scope data by `advertiserId`. There is no enforced authorization layer yet — adding
real ownership checks (a user may only access their advertiser's data) is an open hardening task.

## Design system

Meta-inspired tokens defined in `src/styles/variables.css` and consumed via CSS custom
properties (and surfaced to Tailwind in `tailwind.config.js`). Core tokens:

```css
--brand: #1877F2;          /* Meta blue */
--bg-canvas: #F0F2F5;      /* page background */
--bg-surface: #FFFFFF;     /* card background */
--text-primary: #1C1E21;
--success: #4CAF50;        /* approved */
--danger: #E41E3F;         /* denied */
--warning: #FFC107;        /* waiting */
```
Spacing scale `--sp-2: 8px` … `--sp-6: 24px`; radii `--r-card: 12px`, `--r-md: 8px`,
`--r-pill: 24px`. Status badges use icons plus color (approved / denied / waiting / in-progress).
See `INTEGRATION_SUMMARY.md` for how the Creative Spec design system was brought in.

## Known gaps / gotchas

- **`/components` (repo root) is staging, not live code** — Creative Spec TSX components parked
  for future reuse. The app renders `src/components/`. Don't assume root `/components` is wired in.
- **Some pages still read `src/lib/mockData.js`** rather than the API. When wiring a page to the
  backend, replace the mock import with `src/lib/api.js` calls.
- **No tests and no API build/typecheck in CI.** `tsconfig.json` only type-checks `api/**` and
  `src/lib/shared-db/**`; the `.jsx` UI is not type-checked.
- **Auth and authorization are minimal** (dev-grade login, no per-advertiser access enforcement).
- Historical context (the original spec and prototype) lives in `context/`; treat it as
  background, not a description of the current code.
```
