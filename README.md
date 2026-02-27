## Mini Library Management System (MERN, JavaScript)

### Features

- **Books CRUD**: add/edit/delete/list/details
- **Checkout / Checkin**: availability tracking, borrower + due date, override support for ADMIN/LIBRARIAN
- **Search & filters**: query across title/author/isbn/tags/genre + availability/genre/year filters, pagination, sort
- **Auth**: Google OAuth SSO via Passport + sessions (stored in MongoDB)
- **RBAC**: ADMIN / LIBRARIAN / MEMBER enforced on API + UI
- **AI features**
  - Smart Search: natural language -> structured filters -> DB query + explanation
  - Enrich Book: generate tags/genre/summary and save to book

### Roles

| Role | Permissions |
|------|-------------|
| **ADMIN** | manage users (assign roles), manage books, checkout/checkin, override |
| **LIBRARIAN** | manage books, checkout/checkin, override |
| **MEMBER** | view/search books, checkout for self (no override), use smart search |

### How to run (brief)

Node.js requirement: `^20.19.0 || ^22.13.0 || >=24.0.0` (project default in `.nvmrc` is `20.19.0`).

```bash
nvm use
```

1) Install dependencies:

```bash
npm install
cd server && npm install
cd ../client && npm install
```

2) Create env files: `server/.env` and `client/.env` (values listed below).

3) (Optional) Seed the database (creates sample users + 15 books and resets existing users/books):

```bash
npm run seed
```

4) Run locally (client + server):

```bash
npm run dev
```

5) Run backend tests:

```bash
npm test
```

Open `http://localhost:5173`.

### Environment variables

`server/.env` (required)

- `PORT` (default fallback in code: `4000`)
- `MONGODB_URI` (required by the server startup and seed script)
- `SESSION_SECRET` (recommended)
- `CLIENT_ORIGIN` (for CORS + auth redirects, e.g. `http://localhost:5173`)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` (optional in production same-origin setup; for local dev use `http://localhost:4000/api/auth/google/callback`)
- `AI_PROVIDER` (`mock`, `openai`, or `anthropic`)
- `AI_MODEL` (optional; defaults in code to `gpt-4.1-mini`)
- `OPENAI_API_KEY` (required when using `AI_PROVIDER=openai`)
- `ANTHROPIC_API_KEY` (required when using `AI_PROVIDER=anthropic`)
- `DEFAULT_LOAN_DAYS` (optional; defaults to `14`)

Example:

```dotenv
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/mini_library
SESSION_SECRET=change_me
CLIENT_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
AI_PROVIDER=mock
AI_MODEL=gpt-4.1-mini
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DEFAULT_LOAN_DAYS=14
```

`client/.env` (for local dev)

- `VITE_API_BASE_URL` (e.g. `http://localhost:4000` for local dev; leave unset/empty in production same-origin setup)

Example:

```dotenv
VITE_API_BASE_URL=http://localhost:4000
```

### Google OAuth configuration

In Google Cloud Console OAuth client:

- **Authorized JavaScript origins**
  - `http://localhost:5173`
- **Authorized redirect URIs**
  - `http://localhost:4000/api/auth/google/callback`

For production, add your deployed URLs and update:
- `CLIENT_ORIGIN`
- Google OAuth redirect URI to `https://your-client-domain/api/auth/google/callback`
- `GOOGLE_CALLBACK_URL` only if you are not using same-origin `/api` proxying

### AI provider configuration

Set in `server/.env`:

- `AI_PROVIDER=mock` (recommended for local) or `AI_PROVIDER=openai` / `AI_PROVIDER=anthropic`
- `AI_MODEL=...`
- `OPENAI_API_KEY=...` (if OpenAI)
- `ANTHROPIC_API_KEY=...` (if Anthropic)

AI endpoints are rate-limited (10 requests/min per user).

Code default is `openai`. For local/dev without external API calls, set `AI_PROVIDER=mock`.
If provider calls fail, the AI routes fall back to deterministic mock behavior.

### Deployment (suggested)

- **MongoDB**: MongoDB Atlas for `MONGODB_URI`
- **Server**: Render or Railway
  - Set `CLIENT_ORIGIN` to your client URL
  - Recommended callback in Google OAuth client: `https://your-client-domain/api/auth/google/callback`
- **Client**: Vercel
  - Add rewrite for `/api/(.*)` -> your server `https://your-server.onrender.com/api/$1`
  - Keep `VITE_API_BASE_URL` empty (or unset) so client calls same-origin `/api/...`

### Notes

- The client uses cookies (`withCredentials: true`) to maintain the session.
- Tests do not require real OAuth or AI keys; they use a test-role header injection and the mock AI provider.
