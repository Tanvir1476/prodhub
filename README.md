# ProdHub — Collaborative Product Inventory & Community Contribution Platform

A production-quality web application where **anyone can browse and contribute product information** and a **single Admin** reviews every contribution before it goes live.

- **Visitors (no account):** explore, search, filter and sort products · view details · submit new products · request changes to one or many fields · request removals.
- **Admin (one authorized account):** premium dashboard to add/edit/delete/archive products, approve or reject submissions, change requests and deletion requests, and audit the full request history.

Built with **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui-style components · Lucide icons · Supabase (Postgres, Auth, Storage)**.

---

## Table of contents

1. [Architecture overview](#1-architecture-overview)
2. [Project structure](#2-project-structure)
3. [Supabase setup](#3-supabase-setup)
4. [Admin account setup](#4-admin-account-setup)
5. [Environment variables](#5-environment-variables)
6. [Run locally](#6-run-locally)
7. [Deploy to Vercel](#7-deploy-to-vercel)
8. [Testing the workflows](#8-testing-the-workflows)
9. [Security model](#9-security-model)
10. [Design decisions & notes](#10-design-decisions--notes)

---

## 1. Architecture overview

```
┌──────────────┐   reads (anon key, RLS)    ┌──────────────────────────────┐
│  Visitors    │ ─────────────────────────▶ │ Supabase Postgres            │
│  (no login)  │   submissions/requests     │  products (public read)      │
│              │ ──▶ Server Actions ──────▶ │  product_submissions  ┐      │
└──────────────┘   validate · rate-limit    │  change_requests      │ admin│
                   sanitise · service role  │  deletion_requests    │ only │
┌──────────────┐                            │  admin_activity_logs  ┘      │
│  Admin       │   Supabase Auth session    │  rate_limit_events (server)  │
│  (1 account) │ ─────────────────────────▶ │  RPC: approve_* / reject_*   │
└──────────────┘   RLS + is_admin() + RPC   │  Storage: product-images     │
                                            └──────────────────────────────┘
```

**Key flows**

| Flow | Where it happens | Outcome |
|---|---|---|
| Visitor submits product | `submitProductContribution` server action | Row in `product_submissions` with `status = pending` |
| Visitor requests change | `submitChangeRequest` server action | Row in `change_requests` with `requested_changes` JSONB (`{field: {current, proposed}}`) |
| Visitor requests removal | `submitDeletionRequest` server action | Row in `deletion_requests`, product untouched |
| Admin approves submission | `approve_submission()` SQL function | Product created, submission marked approved, audit log written — **one transaction** |
| Admin approves change | `approve_change_request()` SQL function | Every proposed field applied to the product, request marked approved, logged |
| Admin approves deletion | `approve_deletion_request()` SQL function | Product **archived** (hidden from visitors, recoverable), logged |
| Admin rejects anything | `reject_*()` SQL functions | Status → rejected with rejection reason, product untouched, logged |

All review functions are `SECURITY DEFINER`, re-check `is_admin()` inside the database and run atomically, so a half-applied approval is impossible.

---

## 2. Project structure

```
prodhub/
├── supabase/
│   ├── schema.sql        # tables, constraints, indexes, RLS, RPC functions, storage bucket (idempotent)
│   ├── admin.sql         # registers the Admin user
│   └── seed.sql          # optional sample products
├── src/
│   ├── proxy.ts          # Next.js 16 proxy (middleware): refreshes session, guards /admin
│   ├── app/
│   │   ├── layout.tsx                 # root layout (font, toaster)
│   │   ├── (public)/                  # public site: header + footer layout
│   │   │   ├── page.tsx               # homepage (hero, stats, recent products, how it works)
│   │   │   ├── products/page.tsx      # listing: search, filters, sort, pagination
│   │   │   ├── products/[id]/         # details, request-change, request-removal (+ thank-you pages)
│   │   │   └── contribute/            # add a product (+ thank-you)
│   │   └── admin/
│   │       ├── login/page.tsx         # Admin login
│   │       └── (dashboard)/           # protected: overview, products, submissions,
│   │                                  # change-requests, deletion-requests, history
│   ├── components/
│   │   ├── ui/            # shadcn/ui-style primitives (button, dialog, select, table, …)
│   │   ├── forms/         # product form, change request form, deletion form, image upload
│   │   ├── product/       # product card, image, swatches, zoom, share
│   │   ├── public/        # site header/footer, search bar, filters
│   │   └── admin/         # sidebar, review actions, row actions, diff view
│   └── lib/
│       ├── supabase/      # server / browser / proxy clients
│       ├── actions/       # server actions: public.ts, admin.ts, auth.ts
│       ├── queries.ts     # all read queries
│       ├── validation.ts  # zod schemas + sanitisation
│       ├── images.ts      # upload validation (magic bytes, size, type) + storage helpers
│       ├── rate-limit.ts  # DB-backed sliding-window rate limiter
│       ├── auth.ts        # requireAdmin / requireAdminPage
│       └── constants.ts   # categories, copy, limits
├── .env.example
└── README.md
```

---

## 3. Supabase setup

1. **Create a project** at <https://supabase.com/dashboard> (any region; the free tier is fine).
2. Open **SQL Editor → New query**, paste the whole contents of **`supabase/schema.sql`** and click **Run**.
   This creates the tables, enums, indexes, trigger, RLS policies, review functions and the `product-images` storage bucket. It is idempotent — you can re-run it safely.
3. *(Optional)* Run **`supabase/seed.sql`** for six sample products so the public site isn't empty.
4. Go to **Project Settings → API** and note:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**secret — server only**)
5. **Authentication → Providers → Email**: keep *Email* enabled. You may turn **off** "Allow new users to sign up" — the app never signs anyone up, and the Admin is created manually.

> **Storage note:** the bucket is created by `schema.sql` with a 5 MB limit and JPG/PNG/WEBP only. If your Supabase plan blocks `insert into storage.buckets` from SQL, create a **public** bucket named `product-images` manually in **Storage → New bucket**, then re-run the storage policy section at the bottom of `schema.sql`.

---

## 4. Admin account setup

There is exactly one Admin. It is a normal Supabase Auth user that is registered in the `admin_users` table.

1. **Authentication → Users → Add user → Create new user**
   - Email: your admin email (e.g. `admin@yourdomain.com`)
   - Password: a strong password
   - Tick **Auto Confirm User**
2. Open **`supabase/admin.sql`**, replace `admin@example.com` with that email, run it in the SQL Editor. The query at the bottom should return one row.
3. Set `ADMIN_EMAIL` to the same email in your environment variables.

Login at **`/admin/login`**. Three checks must all pass for admin access: a valid Supabase session, the email equals `ADMIN_EMAIL`, and the user id exists in `admin_users` (checked in the database by `is_admin()`).

To **rotate the Admin**: create the new user, insert it into `admin_users`, delete the old row, update `ADMIN_EMAIL`.

---

## 5. Environment variables

Copy `.env.example` → `.env.local` and fill in:

| Variable | Required | Exposed to browser | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | yes | Anon/public key (RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **never** | Used only in server actions for visitor inserts, uploads and rate limiting |
| `ADMIN_EMAIL` | ✅ | no | Email of the one Admin account |
| `NEXT_PUBLIC_SITE_URL` | optional | yes | Canonical URL for metadata (e.g. `https://prodhub.vercel.app`) |
| `RATE_LIMIT_SALT` | optional | no | Random string used to hash visitor IPs for rate limiting |

---

## 6. Run locally

```bash
npm install
cp .env.example .env.local   # then edit the values
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run build` (production build + type check), `npm run lint`, `npm start`.

---

## 7. Deploy to Vercel

1. Push the project to GitHub/GitLab/Bitbucket.
2. In Vercel: **Add New → Project → Import** the repository. Framework preset: **Next.js** (auto-detected).
3. **Environment Variables**: add every variable from section 5. Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL (you can update it after the first deploy).
4. Click **Deploy**.
5. In Supabase **Authentication → URL Configuration**, set **Site URL** to your Vercel URL (keeps auth cookies/redirects correct).

Images are served from Supabase Storage; `next.config.ts` already allows `*.supabase.co` as a remote image host.

---

## 8. Testing the workflows

### Manual end-to-end checklist

**Public contribution → Admin approval**
1. Visit `/contribute`, fill in a product (try an image — a preview appears before submit), click **Submit Contribution**.
   You should see the confirmation: *"Thank you for your contribution! …awaiting Admin review."*
2. The product must **not** appear on `/products` yet.
3. Log in at `/admin/login`. The Overview shows **Pending Product Submissions: 1**.
4. Open **Product Submissions → View Details → Approve & Publish**. The product now appears on `/products` and the submission shows **Approved** in **Request History**.

**Change request → approval**
1. Open any product, click **Request a Change**, pick *Price* and *Colors*, propose new values, add a reason, submit.
2. Confirm the product is unchanged on the public page.
3. Admin → **Change Requests** shows the request with a current → proposed diff. Click **Approve**.
4. The product page reflects the new price and colors; **Last updated** changes; the Activity log records `change_request.approved`.

**Change request → rejection**
1. Submit another change request. Admin → **Reject** with a reason.
2. Product unchanged; request shows **Rejected** with the note in Request History.

**Deletion request → approval**
1. On a product page click **Request Removal**, choose a reason, submit. The product remains visible.
2. Admin → **Deletion Requests → Approve**. The product disappears from the public site and shows **Archived** in **Products** (filter: *Archived only*), where it can be **restored** or **deleted permanently**.

**Security checks**
- Visit `/admin` while logged out → redirected to `/admin/login`.
- Create a second Supabase user that is *not* in `admin_users` and try to log in → "This account is not registered as the Admin".
- Submit the contribution form 6 times within an hour from the same IP → the 6th is rate-limited.
- Upload a `.exe` renamed to `.png` → rejected ("does not look like a valid … image").

### Database-level test (optional, verified during development)

The SQL layer was exercised against a local PostgreSQL 16 with stand-ins for Supabase's `auth`/`storage` schemas: anonymous role sees only non-archived products and zero submission rows; a non-admin authenticated user calling `approve_submission()` is rejected with *Not authorized*; approving a 3-field change request updates price, quantity and colors atomically; re-approving a reviewed request fails cleanly; approving a deletion archives the product and hides it from `anon`; every action lands in `admin_activity_logs`.

---

## 9. Security model

- **No public write access.** RLS grants `anon`/`authenticated` only `SELECT` on non-archived `products`. All other tables have Admin-only policies; `rate_limit_events` has no policies at all (service role only).
- **Visitor writes go through server actions** that: check a honeypot field → rate-limit by salted IP hash (DB-backed, works across serverless instances) → validate with zod → sanitise text (strip HTML/control chars) → insert with the service role key as `pending`.
- **Image uploads** are validated by size (≤ 5 MB), declared MIME type **and magic bytes** (JPEG/PNG/WEBP signatures), then stored under dated folders in the public bucket.
- **Admin authorization is layered:** proxy redirect (optimistic) → `requireAdminPage()`/`requireAdmin()` in every page and action (session + `ADMIN_EMAIL` + `is_admin()` RPC) → RLS on every table → `assert_admin()` inside every review function.
- **Service role key never reaches the browser.** It lives in `lib/supabase/server.ts` (marked `server-only`).
- **Login hardening:** generic "Invalid email or password" errors, 8 attempts / 15 min rate limit, `next` redirect restricted to `/admin/*`.
- **Open-redirect & XSS:** purchase links must be `http(s)`; links open with `rel="noopener noreferrer nofollow"`; all user text is rendered as text, never HTML.

---

## 10. Design decisions & notes

- **Archive instead of hard delete for approved deletion requests.** The spec allowed "delete or archive safely". Archiving keeps the audit trail and lets the Admin recover mistakes; the Admin can still permanently delete from the Products page (with a confirmation dialog). Deleting a product cascades its change/deletion requests by FK design — the activity log keeps the product name.
- **Change requests store both `current` and `proposed` values** at submission time, so the Admin can see if the product changed in the meantime. Approval re-reads and locks the product row (`FOR UPDATE`).
- **Categories** are a fixed, curated list (`lib/constants.ts`) to keep filters tidy; colors are free text with suggestions and rendered as swatches.
- **Rendering model.** Next.js 16's Cache Components flag is turned off in `next.config.ts`; every data page is server-rendered on demand and revalidated by path after each mutation, which is the right fit for a live inventory.
- **Font** is self-hosted (`@fontsource-variable/plus-jakarta-sans`) rather than fetched from Google at build time, so builds never depend on an external network call.
- **shadcn/ui** components are vendored in `components/ui` (the standard shadcn approach — Radix primitives + Tailwind), so there's no CLI or registry dependency.
- **"Community contributions"** on the homepage = approved submissions + approved change requests.
- **Pagination** uses classic numbered pages (12 per page) — URLs are shareable and SEO-friendly.
