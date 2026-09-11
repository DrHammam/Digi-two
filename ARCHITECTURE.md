# Architecture & Developer Notes

Technical reference for developers working on this repository — the big-picture architecture and conventions that aren't obvious from a quick read.

## Project

Digi+wo Math Hub — an Indonesian-language gamified math learning platform for elementary students (Grades 1–6). Express + MySQL backend serving a no-build vanilla-JS single-page frontend. Five game modes: `quiz`, `drag`, `fill`, `match`, `dino`.

## Commands

```bash
npm install        # install dependencies
npm start          # runs `node backend/server.js` — serves API + frontend on PORT (default 3000)
```

There is **no build step, linter, or test suite**. The frontend is static files served by Express; reload the browser to see changes.

Before first run, copy `.env.example` to `.env` and set MySQL credentials + `ADMIN_USERNAME`/`ADMIN_PASSWORD`. The database is created and seeded automatically on startup — no manual SQL step.

## Architecture

### Startup & migrations
`backend/server.js` requires `backend/migrate.js`, which runs on every startup and is idempotent: it creates the database (default `Digitwo_db`), creates all tables (`CREATE TABLE IF NOT EXISTS`), seeds grades/topics/game-types, and bootstraps the admin account from `ADMIN_USERNAME`/`ADMIN_PASSWORD`. `backend/database.sql` is a reference schema only — migrate.js is the source of truth for the live schema.

### Server-side question authority (the core security model)
Questions are generated and answers validated **only** on the server (`backend/game-logic.js`, exposed via `backend/routes/game.js`). The flow:
1. `POST /api/game/sessions` generates 15 questions, stores them with correct answers in `game_session_questions`, and returns prompts/options **without** answers.
2. `POST /api/game/sessions/:id/answer` validates each answer server-side and increments `correct_count`.
3. On the final answer, the session is marked `completed`, score/stars are computed (`calculateScore`/`calculateStars`), and the result is **mirrored into the legacy `sessions` table** for reporting/analytics.

**Exception:** the `match` (card-pairing) game type returns answers in the session response because the client needs them to render the right-hand cards — validation still happens server-side per pair. Per-grade difficulty (number ranges, multipliers) lives in `getLimits()` in `game-logic.js`.

### Two session tables
- `game_sessions` + `game_session_questions` — the live server-validated game flow.
- `sessions` + `session_responses` — the "legacy" tables that all analytics, user stats, and email reports read from. Completed `game_sessions` are copied here. When changing scoring or reporting, account for both.

### Auth
Opaque Bearer tokens (`crypto.randomBytes`), 7-day TTL, stored in `auth_tokens`. `requireAuth` and `requireAdmin` middleware in `server.js` guard routes. Passwords are bcrypt-hashed; students are auto-registered on first login. The **last remaining admin cannot be deleted or demoted** (`countAdmins` guard). `handleDbError` maps MySQL error codes (1451/1062/1452) to friendly 409/400 responses.

### Frontend (no modules, global load order matters)
Plain `<script>` tags in `frontend/index.html` load in a **strict dependency chain** — each file attaches globals consumed by later files. Order: `i18n.js` → `constants.js` → `store.js` → `api.js` → `session.js` → `admin.js` → `game-match.js` → `game-dino.js` → `ui.js` → `main.js` → `home-override.js`. If you add a file, insert it at the correct point in this chain (in `index.html`).

Key roles: `api.js` is the only place that makes HTTP calls; `store.js` holds app state + a `state.view`/`state.adminView` router and persists only **non-sensitive** data to localStorage (token + profile, never passwords); `ui.js` does all rendering and must HTML-escape user text via `esc()` (XSS protection). `home-override.js` replaces the home layout and loads last.

### Conventions
- All user-facing error/feedback strings are in **Indonesian**.
- Every DB call uses `mysql2` parameterized placeholders (`?`) — keep it that way (SQL-injection prevention).
- Email (parent progress reports via `backend/email.js`/nodemailer) is **optional** and skipped gracefully if `SMTP_*` env vars are unset.

## API
Base URL `http://localhost:3000/api`. Full endpoint table is in `README.md` (auth, game, users/sessions/reports, reference data, and admin/analytics routes). Admin routes require `Authorization: Bearer <token>` with an admin role.
