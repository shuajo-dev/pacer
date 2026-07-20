# Pacer — CLAUDE.md

> This file is read automatically by Claude Code at the start of every session.
> Read it fully before writing any code or making any suggestions.

---

## Who I am

I'm Josh — a full-stack Laravel/PHP developer with ~2 years experience. I work professionally with Laravel, MySQL, and vanilla JS. I'm learning React and TypeScript for the first time through this project. I'm also preparing for technical interviews and need to be able to **explain every concept out loud**, not just make things work.

---

## My learning goals

1. **Understanding over speed** — explain the *why* before the *how*
2. **I type everything** — never generate code I haven't asked for or understood
3. **Connect to what I know** — relate React/TypeScript concepts to Laravel/PHP equivalents I already understand
4. **Interview prep** — I should be able to explain every decision in an interview
5. **Clean architecture** — enforce the layer pattern (FormRequest → Controller → Service → Model → Event) on every feature

### How to teach me

- Ask me what I think before explaining
- Point out my mistakes and ask me to fix them rather than fixing for me
- Give me skeletons to fill in, not complete solutions
- When I'm stuck for more than 5 minutes, give me the next hint not the full answer
- Keep `/learn` mode on permanently — I don't need to invoke it

---

## Project overview

**Pacer** is a gamified running app — portfolio piece + interview prep project.

**USP:** Ghost run feature — when you run the same route, you race a ghost of your previous best pace. Like a time trial in motorsport.

**Core features:**
- Run logging (distance, duration, pace, notes)
- Training plans (C25K style, progressive weeks)
- Ghost run (race your previous PR on the same route)
- Achievements and XP (streaks, first 5K, pace milestones)
- Dashboard (weekly summary, current plan, next ghost to beat)

**Design:** Sporty and Rich aesthetic — warm white/cream backgrounds, British Racing Green `#004225`, French Racing Blue `#002395`, Italian Racing Red `#CE2B37`. Playfair Display (headings) + Inter (body). Mobile-first.

**Tagline:** "Run your ghost."

---

## Repository

```
github.com/shuajo-dev/pacer
```

Monorepo structure:
```
pacer/
├── .ddev/              ← DDEV config (docroot: api/public)
├── api/                ← Laravel 11 backend
├── client/             ← React + TypeScript frontend
└── CLAUDE.md           ← this file
```

---

## Tech stack

### Backend (`/api`)
- **Laravel 13** — PHP framework
- **DDEV** — local Docker development (replaces MAMP/Valet)
- **Laravel Sanctum** — token-based API authentication
- **MariaDB** — database (via DDEV)
- **Queues** — database driver (will upgrade to Redis in Phase 3)

### Frontend (`/client`)
- **React 18** + **TypeScript** — UI framework
- **Vite** — build tool (faster than Create React App, uses ES modules)
- **Tailwind CSS v4** — utility-first styling
- **React Router v6** — client-side routing
- **TanStack Query** — data fetching, caching, loading/error states
- **Axios** — HTTP client with interceptor for auth token

---

## Architecture decisions

### Laravel layer pattern (enforced on every feature)

```
FormRequest   →  validates HTTP input (HTTP only, not for CLI/queues)
Policy        →  authorizes the action (can this user do this?)
Controller    →  thin — calls service, returns response
Service       →  business logic, DB calls, fires events
Model         →  relationships, scopes, accessors, casts
Event/Job     →  side effects (email, queue, notifications)
```

**Why this pattern?** Services are callable from HTTP, CLI commands, and queued jobs. Keeping business logic in the service means it works everywhere. Controllers only translate HTTP ↔ service.

### React architecture

```
src/
├── api/          ← axios functions (one file per Laravel resource)
│   ├── client.ts ← axios instance + auth token interceptor
│   ├── auth.ts   ← login(), register(), getUser()
│   └── runs.ts   ← getRuns(), getRun(), storeRun(), updateRun(), deleteRun()
├── components/   ← reusable UI pieces
├── context/      ← AuthContext (global auth state)
├── hooks/        ← custom hooks
├── pages/        ← route-level components
│   ├── Login.tsx
│   ├── Register.tsx
│   └── runs/
│       ├── RunsList.tsx
│       ├── RunDetail.tsx
│       └── LogRun.tsx
├── types/
│   └── index.ts  ← ALL TypeScript interfaces live here
└── App.tsx       ← routes
```

### Auth flow

1. User logs in → Laravel returns `{ user, token }`
2. Token stored in `localStorage` as `auth_token`
3. Axios interceptor reads token from localStorage and attaches `Authorization: Bearer <token>` to every request
4. On page refresh — `AuthContext` `useEffect` checks localStorage, fetches `/api/user` to rehydrate state
5. `ProtectedRoute` shows `Loading...` while auth check runs, then redirects or renders

---

## What's been built

### Phase 1 — Foundation ✅

**Backend:**
- DDEV monorepo setup (`docroot: api/public`)
- Laravel 11 installed in `/api`
- Laravel Sanctum configured (`php artisan install:api`)
- Register endpoint: `POST /api/register` → `RegisterRequest` → `AuthController` → `AuthService`
- Login endpoint: `POST /api/login` → `LoginRequest` → `AuthController` → `AuthService`
- Health check: `GET /api/health` (closure in routes file)
- CORS configured for `localhost:5173`

**Frontend:**
- React + TypeScript + Vite scaffolded in `/client`
- Tailwind CSS v4, React Router, TanStack Query, Axios installed
- `src/api/client.ts` — axios instance with auth token interceptor
- `src/api/auth.ts` — login(), register(), getUser()
- `src/context/AuthContext.tsx` — user state, login(), logout(), useEffect rehydration, loading state
- `src/components/ProtectedRoute.tsx` — checks loading then user, redirects to /login if unauthenticated
- `src/pages/Login.tsx` — form with handleChange, handleSubmit, error display
- `src/pages/Register.tsx` — same pattern, includes password_confirmation
- `src/App.tsx` — React Router routes

### Phase 2 — Core domain (partially complete) 🚧

**Backend:**
- `runs` migration — id, user_id (FK), distance_km (float), duration_seconds (unsignedInteger), notes (text nullable), timestamps, composite index on (user_id, created_at)
- `Run` model — fillable, casts, `belongsTo(User)` relationship
- `User` model — `hasMany(Run)` relationship added
- `StoreRunRequest` — validates distance_km (required, numeric, min:0.01), duration_seconds (required, integer, min:1), notes (nullable, string)
- `RunService` — `store(array $data): Run`
- `RunPolicy` — view, update, delete check `$user->id === $run->user_id`
- `RunController` — index, store, show, update, destroy with Gate::authorize and RunResource
- `RunResource` — exposes id, distance_km, duration_seconds, notes, created_at
- Routes — `Route::apiResource('runs', RunController::class)` under `auth:sanctum` middleware

**Frontend (in progress):**
- `src/types/index.ts` — User, Run, RunForm interfaces
- `src/api/runs.ts` — getRuns, getRun, storeRun, updateRun, deleteRun
- `src/pages/runs/RunsList.tsx` — TanStack Query, renders run list
- `src/pages/runs/RunDetail.tsx` — useParams, TanStack Query with id
- `src/pages/runs/LogRun.tsx` — form, storeRun, navigate to /runs (in progress)

---

## What's next

### Finish Phase 2

- [ ] Fix `notes` type in `RunForm` (`notes?: string` not `string | null`)
- [ ] Wire runs routes in `App.tsx`
- [ ] Test all pages in browser
- [ ] Style all pages with Tailwind (Sporty and Rich design system)
- [ ] Commit and merge to main

### Phase 3 — Ghost run + gamification

- [ ] PR detection — query personal best for a distance range
- [ ] `GhostRunService` — compute pace checkpoints from PR run
- [ ] `GET /api/runs/{id}/ghost` endpoint
- [ ] React ghost overlay on run detail screen
- [ ] `RunCompleted` event fired from `RunService`
- [ ] `AchievementListener` — checks milestones on run complete
- [ ] Queue the listener (don't block the response)
- [ ] `achievements` table + `UserAchievement` pivot
- [ ] Achievements API + React badge display

### Phase 4 — Polish + portfolio

- [ ] Security headers middleware
- [ ] Rate limiting on auth endpoints
- [ ] Feature tests for `RunService`
- [ ] README with architecture diagram (Mermaid)
- [ ] Postman collection
- [ ] GitHub Actions CI (run tests on push)
- [ ] Deploy: React → Cloudflare Pages, Laravel → Railway

---

## Git workflow

- Branch naming: `feat/feature-name`, `fix/bug-name`, `chore/task-name`
- Commit format: `feat: add runs migration and model`
- Always branch from `main`, open PR, merge via GitHub
- Never commit directly to `main`
- Never rebase pushed commits

## DDEV commands

```bash
ddev start          # start containers
ddev stop           # stop containers
ddev ssh            # shell into web container (run php artisan here)
ddev launch         # open project in browser
```

## Running locally

```bash
# Backend
ddev start
ddev ssh
cd api && php artisan migrate

# Frontend
cd client && npm run dev
# Visit http://localhost:5173
```

---

## Concepts Josh is learning (be patient with these)

- Arrow functions in TypeScript/React (`() => {}` syntax is still new)
- `useState`, `useEffect`, `useContext`, `useParams` hooks
- TanStack Query (`useQuery`, `queryKey`, `queryFn`)
- TypeScript interfaces, union types (`User | null`), generics (`useState<User | null>`)
- React Router (`<Routes>`, `<Route>`, `<Navigate>`, `useNavigate`, `useParams`)
- Async/await in TypeScript
- Component composition and `children` prop
- Tailwind CSS utility classes

## Concepts Josh knows well (don't over-explain)

- Laravel (Eloquent, migrations, middleware, Sanctum, queues, events)
- PHP (classes, interfaces, type hints, dependency injection)
- REST API design
- MySQL/MariaDB
- Git workflow
- DDEV / Docker basics
