# Geovana França — Portfolio

My personal portfolio site, with a static frontend and a serverless backend on Vercel.

**Stack:** HTML/CSS/JavaScript · Node.js serverless functions (Vercel) · PostgreSQL (Neon)

## How it works

| Part | What it does |
| --- | --- |
| `public/index.html` | The portfolio page |
| `public/admin.html` | Password-protected inbox at `/admin` for reading contact messages |
| `api/contact.js` | `POST /api/contact` validates and saves contact form messages to Postgres, with spam protection (honeypot field and a per-visitor rate limit) |
| `api/messages.js` | `GET / PATCH / DELETE /api/messages` lists, marks as read and deletes messages (admin only, Bearer token) |
| `api/views.js` | `POST /api/views` counts site visits |
| `lib/db.js` | Postgres connection pool; creates the tables on first run (`db/schema.sql`) |

## Deploy on Vercel

1. Import this repository at vercel.com/new (framework preset: **Other**).
2. In the project, open **Storage → Create Database → Neon (Postgres)** and connect it. This adds `DATABASE_URL` automatically.
3. In **Settings → Environment Variables**, add `ADMIN_PASSWORD`.
4. Redeploy. The tables are created automatically on the first request.

Optional: add `RESEND_API_KEY` and `NOTIFY_EMAIL` to get an email for every new message.

## Run locally

```bash
npm install
DATABASE_URL=postgres://... ADMIN_PASSWORD=... npm run dev
```

Then open http://localhost:3000.
