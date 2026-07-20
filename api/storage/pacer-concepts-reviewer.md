# Pacer — Concepts Reviewer

> Built while building Pacer. Read before interviews. Each section has a plain-English explanation and a real code example.

---

## Laravel Architecture

### The layer map

Each layer has one job. If you find yourself asking "where does this go?" — use this map.

```
HTTP Request
     ↓
FormRequest     — is this input valid? (HTTP only)
     ↓
Controller      — what should happen? (calls service, returns response)
     ↓
Service         — make it happen (business logic, DB, fire events)
     ↓
Model           — what does this data look like? (relationships, scopes, casts)
     ↓
Event/Job       — side effects (email, queue, notifications)
```

---

### FormRequest

Validates HTTP input before the controller method is even called. If validation fails, Laravel returns a 422 automatically — no code needed.

```php
// app/Http/Requests/Auth/RegisterRequest.php
class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // public endpoint — anyone can register
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }
}
```

**`confirmed`** — automatically checks that `password_confirmation` matches `password`. Your form must send both fields.

**`unique:users,email`** — queries the `email` column in `users` table. Fails if a row already exists.

**Why not validate in the service?** Services are called from CLI commands, queued jobs, and tests — none of which have an HTTP request. Keep HTTP concerns in HTTP layer.

---

### Controller — thin

The controller's only job: translate HTTP into a service call, translate the result into a response. Zero business logic.

```php
class AuthController extends Controller
{
    // Inject service via constructor — available to all methods
    public function __construct(private AuthService $auth) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        // $request->validated() — only the fields that passed rules()
        $result = $this->auth->register($request->validated());

        return response()->json($result, 201);
    }
}
```

**Constructor injection vs `app(AuthService::class)`** — injection means one instance shared across all methods, explicitly declared, and easily swappable in tests.

---

### Service layer

Plain PHP class. No Artisan generator — create it manually. Receives clean data, runs the logic, fires side effects, returns result.

```php
// app/Services/Auth/AuthService.php
class AuthService
{
    public function register(array $data): array
    {
        // Explicit mapping — control over each field, hash the password
        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        // Fire side effect — service owns this, not the controller
        event(new UserRegistered($user));

        $token = $user->createToken('auth_token')->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }
}
```

**Why explicit mapping instead of `User::create($data)`?** If someone sends `is_admin: true` in the request body, you don't accidentally save it. Explicit mapping is your first line of defence; `$fillable` on the model is the second.

---

### Policy

Answers: "is this specific user allowed to do this action on this resource?" Called from the service, not the controller.

```php
// app/Policies/RunPolicy.php
class RunPolicy
{
    public function update(User $authUser, Run $run): bool
    {
        return $authUser->id === $run->user_id;
    }
}

// Usage in service
Gate::authorize('update', $run); // throws 403 automatically if denied
$run->update($data);
```

**Policy vs middleware** — middleware checks broad rules (is this user logged in?). Policy checks specific rules (does this user own this run?).

---

### Eloquent Model

Owns: data shape, relationships, scopes, accessors, casts. Nothing else.

```php
class Run extends Model
{
    protected $fillable = ['user_id', 'distance_km', 'duration_seconds', 'notes'];

    protected $casts = [
        'distance_km' => 'float',
    ];

    // Relationship — knows about its owner
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scope — reusable query filter
    public function scopeThisMonth($query)
    {
        return $query->whereMonth('created_at', now()->month);
    }

    // Accessor — derived value, no DB column needed
    public function getPaceAttribute(): float
    {
        return $this->duration_seconds / 60 / $this->distance_km;
    }
}
```

---

## Laravel Auth (Sanctum)

Token-based auth. Login → get token → send token on every request.

```php
// Login: verify credentials, return token
public function login(array $data): array
{
    if (!Auth::attempt(['email' => $data['email'], 'password' => $data['password']])) {
        throw new \Exception('Invalid credentials');
    }

    $user  = Auth::user();
    $token = $user->createToken('auth_token')->plainTextToken;

    return ['user' => $user, 'token' => $token];
}
```

```bash
# Every authenticated request
Authorization: Bearer 1|abc123xyz...
```

Laravel reads the header → looks up `personal_access_tokens` table → finds user → authenticated.

**`Auth::attempt()`** — looks up user by email, hashes the incoming password, compares. Returns `true`/`false`.

**`Hash::make($password)`** — one-way hash for storage. Never store plain text passwords.

**`Hash::check($plain, $hashed)`** — verify a plain text password against a stored hash.

---

## API Design

### HTTP status codes

```
200 — OK              (GET, PUT success)
201 — Created         (POST that creates a resource)
204 — No Content      (DELETE success, no body)
400 — Bad Request     (malformed request)
401 — Unauthorized    (not authenticated)
403 — Forbidden       (authenticated but not permitted)
404 — Not Found       (resource doesn't exist)
422 — Unprocessable   (validation failed — Laravel default)
429 — Too Many Requests (rate limited)
500 — Server Error    (something broke)
```

### CORS

React on `localhost:5173` calling Laravel on `pacer.ddev.site` = different origins = browser blocks it.

**The server declares what it allows. The browser enforces it.**

```php
// config/cors.php
'allowed_origins' => ['http://localhost:5173'],
```

Laravel adds these headers to responses:
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

In production: replace `localhost:5173` with your real frontend domain. Never ship `*` to production.

---

## Database

### Migrations

```php
// Always has up() and down()
public function up(): void
{
    Schema::create('runs', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->float('distance_km');
        $table->unsignedInteger('duration_seconds');
        $table->text('notes')->nullable();
        $table->timestamps();

        $table->index(['user_id', 'created_at']); // index for common queries
    });
}

public function down(): void
{
    Schema::dropIfExists('runs');
}
```

**Index on `user_id` + `created_at`** — every query like "get Josh's runs this month" uses both columns. Without the index, MySQL scans every row.

---

## Git Workflow

### Conventional commits

```bash
feat: add login endpoint with sanctum token
fix: correct token expiry on refresh
chore: configure ddev database and run migrations
refactor: move validation into RegisterRequest
test: add RunService unit tests
docs: update README with setup steps
```

### Feature branch workflow

```bash
git switch -c feat/runs     # new branch from main
# ... write code
git add .
git commit -m "feat: add runs migration and model"
git push                    # push branch to GitHub
# open PR → merge to main on GitHub
git switch main
git pull                    # pull merged changes locally
```

### Rebase vs merge

```
# merge — joins histories, creates a merge commit
A --- B --- M   (M ties the two branches together)
      \---C-/

# rebase — replays your commits on top, linear history
A --- B --- C   (looks like C was always on top of B)
```

**Golden rule:** never rebase commits already pushed to a shared remote. Rebase rewrites history — anyone who pulled those commits will have a mismatch.

---

## React

### Component anatomy

```tsx
import { useState } from 'react'

interface Props {
  title: string
}

const MyComponent = ({ title }: Props) => {
  const [count, setCount] = useState(0)

  const handleClick = (): void => {
    setCount(count + 1)
  }

  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick}>{count}</button>
    </div>
  )
}

export default MyComponent
```

---

### useState

```tsx
const [user, setUser] = useState<User | null>(null)

// Reading: use user directly
if (!user) return <p>Not logged in</p>

// Writing: always use the setter, never mutate directly
setUser({ id: 1, name: 'Josh', email: 'josh@example.com' })
// ❌ user.name = 'Josh' — never do this
```

Calling the setter triggers a re-render. React compares old and new state and updates only what changed.

---

### useEffect

```tsx
// Runs once after component mounts
useEffect(() => {
  const fetchUser = async () => {
    const userData = await getUser()
    setUser(userData)
  }

  const token = localStorage.getItem('auth_token')
  if (token) fetchUser()
}, []) // [] = run once on mount only
```

**Why async inside useEffect?** `useEffect` itself can't be async — but you can define and call an async function inside it.

**Dependency array:**
```tsx
useEffect(() => { ... }, [])        // once on mount
useEffect(() => { ... }, [userId])  // every time userId changes
useEffect(() => { ... })            // every render (almost never)
```

---

### Context (AuthContext)

Problem: every component needs to know who's logged in. Passing it as props through every component is messy.

Solution: Context — shared state available anywhere in the tree.

```tsx
// 1. Define the shape
interface AuthContextType {
  user: User | null
  loading: boolean
  login: (userData: User, token: string) => void
  logout: () => void
}

// 2. Create and provide
const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // ... login, logout, useEffect

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// 3. Consume anywhere — no prop passing needed
export const useAuth = () => useContext(AuthContext)

// In any component:
const { user, login, logout } = useAuth()
```

---

### ProtectedRoute

```tsx
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth()

  // Wait for auth check — without this, user is always null on first render
  if (loading) return <div>Loading...</div>

  // Not logged in — redirect
  if (!user) return <Navigate to="/login" />

  // Logged in — render the page
  return children
}

// Usage in App.tsx
<Route path="/" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

**Why check `loading` first?** User state resets to `null` on every page refresh. `useEffect` in `AuthContext` fetches the user asynchronously — if you check `user` before it finishes, you always get `null` and always redirect to login.

---

### Navigate vs useNavigate

```tsx
// <Navigate /> — redirect during render
const ProtectedRoute = () => {
  if (!user) return <Navigate to="/login" />
}

// useNavigate() — redirect after an action
const Login = () => {
  const navigate = useNavigate()

  const handleSubmit = async () => {
    await loginApi(formData)
    navigate('/') // redirect after login succeeds
  }
}
```

---

### Form pattern

```tsx
// One state object for all fields
const [formData, setFormData] = useState({ email: '', password: '' })

// One handler for all inputs — e.target.name matches the field key
const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
  setFormData({ ...formData, [e.target.name]: e.target.value })
}

// Submit handler
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
  e.preventDefault()   // stop browser page refresh
  setLoading(true)
  try {
    const data = await loginApi(formData)
    login(data.user, data.token)
    navigate('/')
  } catch (error: any) {
    setErrors(error.response?.data?.errors ?? {})
  } finally {
    setLoading(false)  // always runs — success or fail
  }
}

// Display Laravel validation errors
{errors.email && <p>{errors.email[0]}</p>}
```

---

## TypeScript

### Interfaces

```ts
// Declare the shape of an object
interface User {
  id: number
  name: string
  email: string
}

// Usage
const user: User = { id: 1, name: 'Josh', email: 'josh@example.com' }
const maybeUser: User | null = null  // User OR null
```

### Common patterns

```ts
// Union type — one or the other
user: User | null

// Generic state
useState<User | null>(null)

// Record — object with typed keys and values
errors: Record<string, string[]>
// same as: { [key: string]: string[] }

// Non-null assertion — you guarantee it won't be null
document.getElementById('root')!

// Optional chaining — safely access nested properties
error.response?.data?.errors  // returns undefined if any part is null
```

### `.ts` vs `.tsx`

```
.tsx — contains JSX (<div>, <Component />)
.ts  — pure TypeScript, no JSX (types, API calls, utilities)
```

---

## Axios

### Base client

```ts
// src/api/client.ts
const client = axios.create({ baseURL: '/api' })

// Interceptor — runs before every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config // must return config — forgetting this hangs all requests
})
```

### API functions

```ts
// src/api/auth.ts
export const login = async (data: LoginForm) => {
  const response = await client.post('/login', data)
  return response.data  // axios wraps response body in .data
}

export const getUser = async () => {
  const response = await client.get('/user')
  return response.data
}
```

### Vite proxy

```ts
// vite.config.ts — React calls /api/login, Vite forwards to Laravel
server: {
  proxy: {
    '/api': {
      target: 'https://pacer.ddev.site',
      changeOrigin: true, // rewrites Host header to match target
      secure: false,      // trust DDEV's self-signed certificate (dev only)
    }
  }
}
```

---

## DDEV

```yaml
# .ddev/config.yaml
name: pacer
type: laravel
docroot: api/public   # relative to monorepo root, where index.php lives
php_version: "8.3"
database:
  type: mariadb
  version: "10.11"
```

```bash
ddev start            # start containers
ddev stop             # stop containers
ddev ssh              # shell inside web container
ddev launch           # open project URL in browser
ddev exec <command>   # run command in container without SSHing in
```

Default DB credentials inside DDEV containers:
```
host: db
database: db
username: db
password: db
```

---

*Phase 1 complete — Foundation*
*Next: Phase 2 — Runs feature*

---

## Database — Deeper Dive (Phase 2 additions)

### foreignId vs plain integer

```php
// Plain integer — just a number, nothing enforced
$table->integer('user_id');

// foreignId — UNSIGNED BIGINT + optional constraint chain
$table->foreignId('user_id')->constrained()->cascadeOnDelete();
```

Both are integers in the database. `foreignId()` adds meaning:
- `constrained()` — database-level foreign key constraint. You literally cannot insert a run with a `user_id` that doesn't exist in `users`.
- `cascadeOnDelete()` — delete the user → their runs are deleted automatically.
- Data type matches the `id` on the parent table (`UNSIGNED BIGINT`).

**Constraint alternatives:**
```php
->cascadeOnDelete()   // delete children with parent
->nullOnDelete()      // set FK to null when parent deleted
->restrictOnDelete()  // block parent deletion if children exist
```

### Choosing data types

| Data | Type | Why |
|---|---|---|
| Distance (km) | `float` | 7 significant digits, plenty for 5.32 km |
| Money | `decimal(10,2)` | NEVER float — floats have rounding errors |
| Duration | `unsignedInteger` (seconds) | Raw seconds make math trivial: pace = seconds/60/km |
| Flags | `boolean` | Stored as TINYINT(1) in MySQL |
| Long text | `text` | 65k chars; `string` = VARCHAR(255) |
| Status | `string` or enum | String + validation rule is more flexible than DB enum |

**Store raw, format on display.** Store `duration_seconds = 1830`, display `30:30` via an accessor or in React. Never store formatted strings like `"30:30"` — you can't do math on them.

### Naming conventions

```
distance_km        ← unit in the name, no ambiguity
duration_seconds   ← same
user_id            ← singular table name + _id for foreign keys
created_at         ← Laravel timestamps() handles this
```

---

## TanStack Query (Phase 2 additions)

### Why TanStack Query over useEffect + useState?

```tsx
// Without TanStack Query — repetitive boilerplate
const [runs, setRuns] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  getRuns()
    .then(setRuns)
    .catch(setError)
    .finally(() => setLoading(false))
}, [])

// With TanStack Query — same result, less code
const { data: runs, isLoading, isError } = useQuery({
  queryKey: ['runs'],
  queryFn: getRuns,
})
```

TanStack Query also gives you: automatic caching, background refetching, deduplication of identical requests, and stale-while-revalidate. You get all of this for free.

### useQuery

```tsx
const { data, isLoading, isError } = useQuery({
  queryKey: ['runs'],        // unique cache key — array format
  queryFn: getRuns,          // async function that fetches data
})
```

**queryKey** — uniquely identifies this query in the cache. Same key = same cached data. Use arrays: `['runs']` for all runs, `['runs', id]` for a specific run.

**queryFn** — the function that fetches data. Must return a promise.

### Dynamic queries (with params)

```tsx
const { id } = useParams()  // get :id from URL

const { data: run } = useQuery({
  queryKey: ['runs', id],           // cache per run id
  queryFn: () => getRun(Number(id)), // wrap in arrow function to pass id
})
```

Why `Number(id)`? `useParams()` returns strings — `getRun` expects a number.

### Handling states

```tsx
if (isLoading) return <div>Loading...</div>
if (isError) return <div>Something went wrong</div>
// data is guaranteed to exist below this point
return <div>{data.distance_km} km</div>
```

Always handle loading and error before rendering data.

---

## React Router — useParams

```tsx
import { useParams } from 'react-router-dom'

// Route defined as: /runs/:id
const { id } = useParams()  // id = "3" (always a string)
```

Use `Number(id)` or `parseInt(id)` when you need it as a number.

---

## API Resource Layer Pattern

```
src/api/
├── client.ts    ← axios instance + interceptor (configured once)
├── auth.ts      ← login(), register(), getUser()
└── runs.ts      ← getRuns(), getRun(), storeRun(), updateRun(), deleteRun()
```

Each file maps to one Laravel resource. Functions mirror the HTTP methods:

```ts
getRuns()              → GET    /api/runs
getRun(id)             → GET    /api/runs/:id
storeRun(data)         → POST   /api/runs
updateRun(id, data)    → PUT    /api/runs/:id
deleteRun(id)          → DELETE /api/runs/:id
```

---

## Laravel — apiResource routes

```php
// One line replaces 5 routes
Route::apiResource('runs', RunController::class);

// Generates:
// GET    /api/runs          → index
// POST   /api/runs          → store
// GET    /api/runs/{run}    → show
// PUT    /api/runs/{run}    → update
// DELETE /api/runs/{run}    → destroy
```

`{run}` triggers **route model binding** — Laravel automatically finds the `Run` by ID and injects the model into the controller method. No manual `Run::findOrFail($id)` needed.

---

## Laravel — RunResource

Controls exactly what the API returns. Never expose internal fields accidentally.

```php
public function toArray(Request $request): array
{
    return [
        'id'               => $this->id,
        'distance_km'      => $this->distance_km,
        'duration_seconds' => $this->duration_seconds,
        'notes'            => $this->notes,
        'created_at'       => $this->created_at,
    ];
}

// Single resource
return response()->json(new RunResource($run));

// Collection
return response()->json(RunResource::collection($runs));
```

---

## Laravel — Gate::authorize in controllers

```php
// Throws 403 automatically if policy returns false
Gate::authorize('view', $run);
Gate::authorize('update', $run);
Gate::authorize('delete', $run);
```

Laravel maps `'view'` → `RunPolicy::view()`, passes the authenticated user automatically. You don't pass the user manually.

*Phase 2 complete — Runs feature*
*Next: Phase 3 — Ghost run + gamification*
