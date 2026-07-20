# Pacer — Interview Q&A

> Questions an interviewer would actually ask. Answers written the way you should say them out loud — direct, concrete, no fluff.

---

## Laravel Architecture

**Q: What's the difference between a controller and a service in Laravel?**

The controller's job is to translate HTTP into a service call and translate the result back into a response. It knows *what* to do but not *how*. The service contains the actual business logic — it creates records, fires events, and handles side effects. If you delete the controller, the service should still be callable from a CLI command or a queued job. If you delete the service, the controller has nothing to call.

---

**Q: Where do you put validation in Laravel?**

Two places, for two different reasons. `FormRequest` handles HTTP input validation — is the data well-formed? That lives at the HTTP layer because it's specific to incoming requests. Business rule validation — like "can this user actually do this action?" — lives in the service or a Policy, because those rules apply regardless of whether the call comes from HTTP, a CLI command, or a queue.

---

**Q: What's a Laravel Policy and when would you use one?**

A Policy answers the question: "is this specific user allowed to perform this specific action on this specific resource?" For example, in Pacer, only the user who logged a run can edit or delete it. The Policy checks `$authUser->id === $run->user_id`. You call it from the service with `Gate::authorize('update', $run)` — if it returns false, Laravel throws a 403 automatically. You use a Policy instead of putting that check in the controller because the rule belongs to the resource, not the HTTP layer.

---

**Q: Why would you use `$request->validated()` instead of `$request->all()`?**

`validated()` returns only the fields that were declared in `rules()`. `all()` returns everything the user sent — including fields you didn't expect, like `is_admin: true`. Using `validated()` means you never accidentally save data you didn't intend to accept. It's a simple habit that prevents a whole class of security bugs.

---

**Q: What does `$fillable` do on a Laravel model?**

It's a whitelist of columns that can be mass-assigned — meaning passed directly to `create()` or `fill()`. If a column isn't in `$fillable`, Eloquent ignores it even if it's in the data array. It's a second layer of defence against mass assignment attacks, after `$request->validated()`.

---

**Q: What's the difference between `Auth::attempt()` and `Hash::check()`?**

`Auth::attempt()` does both the lookup and the password check in one call — it finds the user by email, hashes the incoming password, and compares. It returns `true` or `false`. `Hash::check()` is the lower-level tool — it takes a plain text password and a stored hash and compares them directly. You'd use `Hash::check()` when you already have the user object and just need to verify a password.

---

**Q: How does Sanctum token authentication work?**

When a user logs in, Laravel creates a record in the `personal_access_tokens` table and returns the plain text token to the client. The client stores it and sends it on every subsequent request in the `Authorization: Bearer <token>` header. Laravel reads that header, looks up the token in the database, finds the associated user, and considers the request authenticated. Logging out deletes the token record from the database — the token becomes useless even if someone still has the string.

---

## API Design

**Q: What HTTP status code do you return when creating a resource?**

201. 200 means "OK, here's what you asked for." 201 means "OK, I created something new." The distinction matters for clients that need to know whether a resource was created or just retrieved.

---

**Q: What's the difference between 401 and 403?**

401 means "I don't know who you are — please authenticate." 403 means "I know who you are, but you're not allowed to do this." In practice: hitting a protected endpoint without a token = 401. Trying to edit someone else's run while authenticated = 403.

---

**Q: What is CORS and how do you configure it in Laravel?**

CORS is a browser security policy that blocks requests from one origin to another. If React on `localhost:5173` calls Laravel on `pacer.ddev.site`, the browser sees different origins and blocks it. The server — Laravel — declares what origins it allows in `config/cors.php`. Laravel adds the appropriate headers to responses, and the browser reads them and decides whether to allow the request through. The browser enforces CORS, but the server controls the rules.

---

**Q: What's the difference between 422 and 400?**

400 is "the request is malformed" — wrong content type, invalid JSON structure, missing required headers. 422 is "the request is well-formed but the data doesn't pass validation" — the JSON is valid, but the email is already taken. Laravel returns 422 for FormRequest validation failures by default.

---

## Database

**Q: Why do you add indexes to foreign keys?**

When you query "get all runs for user 1", MySQL scans every row in the `runs` table to find matching `user_id` values — unless there's an index. An index on `user_id` lets MySQL jump directly to the relevant rows. Without indexes on foreign keys, every join or relationship query does a full table scan. In a table with 170k records like my school platform, that's the difference between milliseconds and seconds.

---

**Q: What's the difference between `up()` and `down()` in a migration?**

`up()` applies the change — creates the table, adds a column, adds an index. `down()` reverses it — drops the table, removes the column. `down()` is what runs when you call `php artisan migrate:rollback`. In production you rarely rollback, but during development it's essential. The rule is: if you can't reverse it cleanly in `down()`, you need to think harder about your migration strategy.

---

**Q: When would you add a composite index?**

When you frequently query on multiple columns together. In Pacer, almost every runs query is "get runs for this user, ordered by date" — so a composite index on `(user_id, created_at)` makes sense. The column order in a composite index matters — the leftmost column is the primary filter. `(user_id, created_at)` is efficient for filtering by user then sorting by date, but not for filtering by date alone.

---

## Git

**Q: What's the difference between rebase and merge?**

Merge combines two histories and creates a merge commit that ties them together — you can see both branches existed. Rebase replays your commits on top of the target branch — the history looks linear, as if you never diverged. For integrating remote changes into your branch, I use merge. For cleaning up local commits before a PR, I use rebase. The rule I follow: never rebase commits that have already been pushed to a shared remote, because rebase rewrites history and anyone who pulled those commits will have a mismatch.

---

**Q: What are conventional commits and why do you use them?**

A format for commit messages: `type: description`. Types like `feat`, `fix`, `chore`, `refactor`. It makes the git history readable at a glance — you can scroll commits and understand what changed and why without opening the diff. It also enables automated tooling like changelog generation and semantic versioning. I use it on personal projects to build the habit, because every team I've seen uses some variation of it.

---

## React

**Q: What is React Context and when would you use it?**

Context is React's way of sharing state across the whole component tree without passing props down through every level. I use it in Pacer for auth state — once a user logs in, the dashboard, the header, the run list all need to know who they are. Without Context I'd have to pass `user` as a prop from App down to every child that needs it. With Context, any component calls `useAuth()` and gets the user directly. I wouldn't use it for everything — local state that only one component needs should stay in `useState`. Context is for state that multiple unrelated components need.

---

**Q: What is `useEffect` and what's the dependency array for?**

`useEffect` runs code after a component renders — side effects that don't belong in the render itself, like fetching data or setting up subscriptions. The dependency array controls when it re-runs. An empty array `[]` means run once when the component mounts. If you put a value in the array like `[userId]`, the effect re-runs every time `userId` changes. No array at all means it runs after every render, which is almost never what you want.

---

**Q: Why did you need a loading state in your AuthContext?**

Without it, the ProtectedRoute checks `user` on every page load — and `user` starts as `null` because React state resets on refresh. The ProtectedRoute would see `null` and redirect to login before the `useEffect` even had a chance to fetch the user from the API. The loading state acts as a gate: "don't make any routing decisions until the auth check is complete." It starts as `true`, and only flips to `false` after the user fetch either succeeds or confirms there's no token.

---

**Q: What's the difference between `<Navigate />` and `useNavigate()`?**

`<Navigate />` is a component you return from render — it causes an immediate redirect when the component mounts. `useNavigate()` is a hook that gives you a `navigate` function you call inside event handlers or effects — after something happens. ProtectedRoute uses `<Navigate />` because the redirect happens during render based on auth state. The login form uses `useNavigate()` because the redirect happens after the API call succeeds.

---

**Q: How do you handle API errors from Laravel in React?**

Laravel returns validation errors as a JSON object under the `errors` key with a 422 status. Axios throws an error on 4xx responses, so I catch it and read `error.response?.data?.errors`. I store those in state and display them under the relevant form fields. The optional chaining `?.` means if any part of that chain is null, I get `undefined` instead of a crash. I fall back to an empty object with `?? {}` so the errors state is always the right type.

---

## TypeScript

**Q: Why did you choose TypeScript over JavaScript for Pacer?**

Two reasons. First, I'm working solo with no code reviewer — TypeScript acts as an automated reviewer that catches mistakes like wrong property names, missing fields, or passing the wrong type to a function. Second, most remote roles I'm targeting list TypeScript as a requirement. Learning it on a real project means I can speak to it honestly in interviews rather than just listing it on a CV.

---

**Q: What's a union type and when would you use one?**

A union type means a value can be one of several types — `User | null` means it's either a User object or null. I use it for auth state because before login, there's no user — it's null. After login, it's a User. TypeScript forces you to handle both cases, which prevents the common bug of trying to access `user.name` when `user` is still null.

---

**Q: What does the `!` operator do in TypeScript?**

It's the non-null assertion operator. `document.getElementById('root')` returns `HTMLElement | null` because the element might not exist. The `!` tells TypeScript "trust me, this won't be null at runtime." It suppresses the TypeScript error without changing the runtime behaviour. I use it sparingly — only when I'm certain the value exists, like the root element that's always in the HTML.

---

*Phase 1 complete*
*Update after each phase with new questions*

---

## Database — Phase 2 additions

**Q: What does `foreignId()->constrained()` actually do in a Laravel migration?**

`foreignId('user_id')` creates an unsigned bigint column matching the parent table's `id` type. `constrained()` adds a database-level foreign key constraint — the database itself rejects any insert where `user_id` doesn't exist in the `users` table. This is enforcement at the data layer, not just the application layer. Even if someone bypasses Laravel entirely and runs raw SQL, the constraint holds.

---

**Q: Why would you store duration as seconds instead of a TIME column?**

Because you do math on durations. Pace is distance divided by time — with raw seconds that's simple arithmetic: `duration_seconds / 60 / distance_km` gives minutes per km. With a TIME column you'd have to parse it into a number first, do the math, then format it back. The principle is: store raw values, format for display. The database stores `1830`, the UI shows `30:30`.

---

**Q: When would you use float vs decimal in a database?**

Float for measurements where tiny precision loss doesn't matter — distances, weights, temperatures. Decimal for money, always — floats have binary rounding errors, so `0.1 + 0.2` doesn't exactly equal `0.3`. For currency that's unacceptable. `decimal(10,2)` stores exact values. The rule: if you'd be upset about being off by a fraction of a cent, use decimal.

---

**Q: What's the difference between cascadeOnDelete and nullOnDelete?**

They control what happens to child records when the parent is deleted. `cascadeOnDelete` deletes the children too — delete a user, their runs disappear. `nullOnDelete` keeps the children but sets the foreign key to null — useful when the child record has value independent of the parent, like keeping orders after a customer account is deleted. `restrictOnDelete` blocks the deletion entirely if children exist. The choice is a business decision, not a technical one.

---

## TanStack Query & React Data Fetching (Phase 2)

**Q: Why use TanStack Query instead of useEffect for data fetching?**

`useEffect` for data fetching means writing the same loading/error/data state boilerplate every time. TanStack Query handles all of that plus gives you caching, background refetching, and request deduplication for free. If two components need the same data, TanStack Query makes one request and shares the result. With `useEffect` you'd either make two requests or lift the state up manually.

---

**Q: What is a queryKey and why does it matter?**

The `queryKey` is the cache identifier for a query. `['runs']` caches all runs together. `['runs', 3]` caches run with id 3 separately. If two components use the same `queryKey`, they share the same cached data and TanStack Query only fetches once. It's also how you invalidate the cache after a mutation — "clear everything with key `['runs']`" so the list refetches after you log a new run.

---

**Q: What is route model binding in Laravel?**

When you define a route with `{run}` as a parameter, Laravel automatically queries the database for a `Run` with that ID and injects the model into your controller method. Instead of writing `$run = Run::findOrFail($id)` in every method, you just type-hint `Run $run` and it's already there. If the ID doesn't exist, Laravel returns a 404 automatically.

---

**Q: What does an API Resource do and why use it?**

An API Resource controls exactly what fields your API returns. Without it, `response()->json($run)` returns every column on the model including things you might not want to expose. With a Resource you explicitly list the fields — `id`, `distance_km`, `duration_seconds`, `notes`, `created_at` — and nothing else gets out. It also lets you transform data, add computed fields, and keep your API response shape stable even if the database schema changes.

---

**Q: How does Gate::authorize work with policies?**

`Gate::authorize('update', $run)` looks up the `RunPolicy`, calls its `update()` method with the currently authenticated user and the `$run` model, and if it returns `false`, throws a 403 exception automatically. You don't pass the user manually — Laravel reads it from the auth session. The policy method itself is a simple boolean check: `return $user->id === $run->user_id`.

---

**Q: What's useParams and when do you use it?**

`useParams()` reads dynamic segments from the current URL. If the route is `/runs/:id` and the user is on `/runs/3`, `useParams()` returns `{ id: '3' }`. Always a string — convert with `Number(id)` when you need an integer. You use it in detail pages where the component needs to know which specific resource to fetch.

---

**Q: Why do you store types in a central index.ts file?**

Single source of truth. If the `Run` interface is defined in three different files and the API changes — say, `distance_km` becomes `distance` — you'd have to find and update every definition. In `types/index.ts` you update once and everywhere that imports it is automatically correct. It also makes it easy to see all your data shapes in one place, which helps when designing API responses and database schemas together.
