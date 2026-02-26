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

### Local setup

1) Install dependencies:

```bash
npm install
cd server && npm install
cd ../client && npm install
```

2) Create env files:

- Copy `server/.env.example` to `server/.env` and fill values.
- Copy `client/.env.example` to `client/.env` (optional if using default `http://localhost:4000`).

3) Seed the database (creates sample users + 15 books):

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

### Google OAuth configuration

In Google Cloud Console OAuth client:

- **Authorized JavaScript origins**
  - `http://localhost:5173`
- **Authorized redirect URIs**
  - `http://localhost:4000/api/auth/google/callback`

For production, add your deployed URLs and update:
- `CLIENT_ORIGIN`
- `GOOGLE_CALLBACK_URL`

### AI provider configuration

Set in `server/.env`:

- `AI_PROVIDER=openai` or `AI_PROVIDER=anthropic`
- `AI_MODEL=...`
- `OPENAI_API_KEY=...` (if OpenAI)
- `ANTHROPIC_API_KEY=...` (if Anthropic)

AI endpoints are rate-limited (10 requests/min per user).

### Deployment (suggested)

- **MongoDB**: MongoDB Atlas for `MONGODB_URI`
- **Server**: Render or Railway
  - Set `CLIENT_ORIGIN` to your client URL
  - Set `GOOGLE_CALLBACK_URL` to `https://your-server/api/auth/google/callback`
- **Client**: Vercel
  - Set `VITE_API_BASE_URL` to your server URL (e.g. `https://your-server.onrender.com`)

### Notes

- The client uses cookies (`withCredentials: true`) to maintain the session.
- Tests do not require real OAuth or AI keys; they use a test-role header injection and a mocked AI provider.

