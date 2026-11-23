# Feedback Website – Backend

Node.js + Express + SQLite REST API.

## Setup

```bash
npm install
# Linux/macOS
ADMIN_KEY=my-secret ALLOWED_ORIGIN=http://localhost:5500 npm start
# Windows (PowerShell)
$env:ADMIN_KEY="my-secret"; $env:ALLOWED_ORIGIN="http://localhost:5500"; npm start
```

The server runs on http://localhost:3000 and creates `feedback.db` automatically.

Environment variables (see `.env.example`):

| Variable         | Purpose                                              | Default     |
|------------------|------------------------------------------------------|-------------|
| `PORT`           | Port to listen on                                    | `3000`      |
| `ADMIN_KEY`      | Secret needed for admin endpoints                    | `change-me` |
| `ALLOWED_ORIGIN` | Frontend URL allowed by CORS (`*` allows any)        | `*`         |
| `DB_FILE`        | Path to the SQLite file                              | `./feedback.db` |

## Endpoints

| Method | Path                 | Auth                  | Description                |
|--------|----------------------|-----------------------|----------------------------|
| GET    | `/api/health`        | none                  | Health check               |
| POST   | `/api/feedback`      | none (rate-limited)   | Submit feedback            |
| GET    | `/api/feedback`      | `x-admin-key` header  | List feedback (`limit`, `offset`) |
| GET    | `/api/stats`         | `x-admin-key` header  | Total, average, distribution |
| DELETE | `/api/feedback/:id`  | `x-admin-key` header  | Delete an entry            |

POST body (JSON):

```json
{
  "name": "Mukesh",
  "email": "optional@example.com",
  "category": "General",
  "rating": 5,
  "message": "Great site!"
}
```

Categories: General, Bug, Feature Request, Design, Other.
