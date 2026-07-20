# Pacer — Learning-Focused Migration Plan

> For use in Claude Code. Each task is a learnable chunk with context, not just a ticket.

---

## How to use this in Claude Code

Start each session by saying:
> "I'm continuing work on Pacer. Read CLAUDE.md for full context. Today I want to work on: [task from this list]. Teach me the concept before we write any code."

---

## Remaining tasks — Phase 2 (finish now)

### Task 1 — Fix RunForm notes type
**What:** Change `notes` in `RunForm` from `string | null` to `notes?: string`
**Why:** HTML inputs return empty strings, not null. Optional (`?`) is cleaner for form fields.
**Laravel parallel:** Like a nullable column in a migration — the field can be absent, not explicitly null.
**Understand before moving on:** Difference between `null`, `undefined`, and optional (`?`) in TypeScript.

### Task 2 — Wire runs routes in App.tsx
**What:** Add `/runs`, `/runs/:id`, `/runs/log` routes wrapped in `ProtectedRoute`
**Why:** Routes define what URL renders what component. Protected routes gate them behind auth.
**Laravel parallel:** `routes/api.php` with `auth:sanctum` middleware group.
**Understand before moving on:** How `useParams` reads the `:id` from the URL.

### Task 3 — Test all pages in browser
**What:** Visit `/runs`, `/runs/1`, `/runs/log` and verify they render and call the API correctly.
**Why:** Manual testing before styling catches logic bugs early.
**Understand before moving on:** How TanStack Query handles loading/error/success states.

### Task 4 — Style all pages (Sporty and Rich design)
**What:** Apply Tailwind classes to Login, Register, RunsList, RunDetail, LogRun.
**Why:** Portfolio piece needs to look professional. Design system is already defined.
**Laravel parallel:** Like writing Blade templates — structure first, style second.
**Understand before moving on:** Tailwind's utility class model (mobile-first, `md:` prefix for breakpoints).

---

## Phase 3 — Ghost run + gamification

### Task 5 — PR detection query
**What:** Query that finds a user's personal best run for a given distance (within ±10%).
**Concept:** Eloquent scopes + aggregate queries (`min`, `where`, `orderBy`).
**Why this way:** The ghost run compares against your best, not your last. PR detection is a reusable scope.
**Laravel parallel:** Like `scopeActive()` on a model — a reusable query filter.
**Understand before moving on:** How Eloquent scopes work and when to use them vs raw queries.

### Task 6 — GhostRunService
**What:** Service that takes a PR run and computes pace checkpoints (pace per km).
**Concept:** Pure business logic class — no HTTP, no DB writes.
**Why this way:** Separating computation from data access makes it testable in isolation.
**Laravel parallel:** Same service pattern as `AuthService` and `RunService`.
**Understand before moving on:** What "pure function" means and why it matters for testing.

### Task 7 — Ghost endpoint
**What:** `GET /api/runs/{id}/ghost` — returns ghost pace data for a given run.
**Concept:** Nested resource routes, computed API responses (data not stored, computed on request).
**Why this way:** Ghost data is derived from existing runs — no need to store it separately.
**Laravel parallel:** An accessor on a model that computes a value rather than reading a column.
**Understand before moving on:** Difference between stored data and computed responses in API design.

### Task 8 — RunCompleted event
**What:** Fire a `RunCompleted` event from `RunService::store()` after a run is saved.
**Concept:** Laravel Events — decouple side effects from the action that triggers them.
**Why this way:** The service shouldn't know about achievements, emails, or stats. It just says "a run was completed" and other parts of the app react.
**Laravel parallel:** Like a database trigger, but in application code. "When X happens, do Y."
**Understand before moving on:** Event vs Listener vs Job — what each one is responsible for.

### Task 9 — AchievementListener (queued)
**What:** Listener that checks achievement conditions when `RunCompleted` fires, dispatched to the queue.
**Concept:** Queued listeners — the API response returns immediately, achievement checking happens in the background.
**Why this way:** Achievement checking could involve multiple DB queries. Don't block the user's response for that.
**Laravel parallel:** Like `dispatch(new ProcessRun($run))` — work done asynchronously.
**Understand before moving on:** What a queue worker does and why queues matter for performance.

### Task 10 — Achievements table + pivot
**What:** `achievements` table + `user_achievement` pivot table with `unlocked_at` timestamp.
**Concept:** Many-to-many with extra pivot data.
**Laravel parallel:** Like a `role_user` table with `assigned_at` — same pattern.
**Understand before moving on:** `belongsToMany` with `withPivot()` and `withTimestamps()`.

### Task 11 — React ghost overlay
**What:** On RunDetail, show a pace comparison chart — your run vs ghost run.
**Concept:** TanStack Query for the ghost endpoint, data visualization with a simple chart.
**Why this way:** The ghost data is fetched separately — it's a derived resource, not part of the run itself.
**Understand before moving on:** How to make two `useQuery` calls in one component.

### Task 12 — React achievements display
**What:** Achievements page showing earned badges with unlock date.
**Concept:** TanStack Query collection, conditional rendering based on unlock status.
**Understand before moving on:** How to render different UI based on whether an achievement is locked/unlocked.

---

## Phase 4 — Polish + portfolio

### Task 13 — Security headers middleware
**What:** Laravel middleware that adds CSP, HSTS, X-Frame-Options, X-Content-Type-Options to every response.
**Concept:** Middleware pipeline — wraps every response without touching controllers.
**Laravel parallel:** Like `auth:sanctum` middleware but for security headers.
**Understand before moving on:** What each header does and which attacks it prevents.

### Task 14 — Rate limiting
**What:** Throttle auth endpoints — max 5 login attempts per minute per IP.
**Concept:** Laravel's built-in `throttle` middleware, 429 Too Many Requests response.
**Why this way:** Prevents brute force attacks on the login endpoint.
**Understand before moving on:** What rate limiting is and why it belongs at the middleware layer.

### Task 15 — Feature tests for RunService
**What:** PHPUnit tests for `RunService::store()` — test happy path, validation, policy enforcement.
**Concept:** Arrange-Act-Assert pattern, Laravel test factories, database transactions in tests.
**Why this way:** Tests document expected behaviour and catch regressions when you refactor.
**Laravel parallel:** `php artisan test` — you've probably seen this but not written tests from scratch.
**Understand before moving on:** Why you test the service, not the controller (hint: services are where the logic lives).

### Task 16 — README with architecture diagram
**What:** `README.md` with setup steps, architecture diagram in Mermaid, feature list.
**Why:** An interviewer who visits your GitHub sees the README first. Make it count.
**Understand before moving on:** How to write a Mermaid diagram in Markdown (GitHub renders them natively).

### Task 17 — GitHub Actions CI
**What:** `.github/workflows/test.yml` — runs `php artisan test` on every push to main.
**Concept:** CI/CD basics — automated testing on every commit.
**Why this way:** Proves to interviewers you understand automated testing pipelines.
**Understand before moving on:** What a GitHub Actions workflow file does and when it triggers.

### Task 18 — Deploy
**What:** React → Cloudflare Pages, Laravel → Railway.
**Concept:** Static site hosting vs server hosting, environment variables in production.
**Understand before moving on:** Why React can be hosted on Cloudflare (static files) but Laravel needs a server (PHP runtime).

---

## Learning checkpoints

After each phase, you should be able to answer these without notes:

**After Phase 2:**
- Explain the full auth flow from login form to protected route
- Draw the Laravel layer map and explain each layer's responsibility
- Explain what TanStack Query does differently from useEffect

**After Phase 3:**
- Explain event-driven architecture using RunCompleted as an example
- Explain why achievements are queued and what happens if the queue fails
- Explain what a many-to-many relationship with pivot data looks like in the database

**After Phase 4:**
- Explain what each security header does
- Explain the Arrange-Act-Assert pattern with a real test example
- Walk an interviewer through deploying a Laravel + React app

