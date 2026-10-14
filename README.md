# Employee Management System

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + PostgreSQL (`pg`).

## Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL 13+ (pgAdmin 4)

## 1. Create the database and tables

> **Already have these tables?** Skip this section and jump to step 2. Make sure your existing `"user"` table has the columns the app uses: `id`, `email`, `password_hash`, `role`, `is_active`, `created_at`.

Open **pgAdmin 4** and connect to your PostgreSQL server.

1. Create the database: right-click **Databases** → **Create** → **Database...** → name it `ems` → **Save**.
2. Open the Query Tool on `ems`: right-click the `ems` database → **Query Tool**.
3. Open `db/schema.sql` (File → Open, or paste it in) and press **F5** to execute.
4. Verify the tables: expand `ems` → **Schemas** → **public** → **Tables**. You should see 8 tables: `department`, `position`, `user`, `leave_type`, `employee`, `attendance`, `leave_request`, `leave_balance`.

> `"user"` is a reserved keyword in PostgreSQL, so it must always be double-quoted in SQL: `SELECT * FROM "user";`

Want to check with SQL instead of the tree? Run `\dt` in the Query Tool to list all tables.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ems
SESSION_SECRET=<a 32-byte base64 secret>
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

If your Postgres password contains special characters, URL-encode them in `DATABASE_URL`.

## 3. Run the app

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000, then create an account at `/signup` and sign in at `/login`.

## Authentication

- **Signup** (`/signup`) inserts into `"user"` (`email`, `password_hash`, `role`) with bcrypt-hashed passwords. New accounts get the `employee` role.
- **Login** (`/login`) verifies the bcrypt hash and rejects disabled accounts (`is_active = false`).
- **Session** is a signed JWT (HS256, `jose`) stored in an `httpOnly` cookie named `session`, valid for 7 days. The token holds **only the user id** — the role is read from the database on each request, so role and status changes apply immediately.
- **Dashboard** (`/dashboard`) reads the session via the data access layer in `src/lib/dal.ts`.

## Admin dashboard

`/admin` is restricted to `role = 'admin'`. It shows counts for employees, departments, positions, users, and pending leave requests, plus a user table where an admin can change roles and disable accounts. An admin cannot edit their own row, so they cannot lock themselves out.

Role changes take effect on the target user's very next request, because `getCurrentUser()` re-reads `role` and `is_active` from the database instead of trusting the cookie.

### Promoting the first admin

Signup always creates an `employee`, so bootstrap the first admin with SQL. Sign up normally at `/signup`, then run this in pgAdmin's Query Tool:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'your.email@example.com';
```

Sign out and back in (or just reload) and the **Admin dashboard** link appears on `/dashboard`. Allowed roles are `admin`, `hr`, `manager`, `employee`.


### Key files

| Path                          | Purpose                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `db/schema.sql`               | Full PostgreSQL schema                                                                               |
| `src/lib/db.ts`               | Shared `pg` connection pool                                                                          |
| `src/lib/session.ts`          | JWT sign/verify and session cookie helpers                                                           |
| `src/lib/dal.ts`              | `getCurrentUser()` / `requireUser()` / `requireAdmin()` data access layer                            |
| `src/lib/roles.ts`            | Role constants, kept in sync with the `user_role_check` constraint                                   |
| `src/lib/admin.ts`            | Admin stats and user list queries                                                                    |
| `src/lib/definitions.ts`      | Zod schemas and form state types                                                                     |
| `src/app/actions/auth.ts`     | `signup`, `login`, `logout` Server Actions                                                           |
| `src/app/admin/user-actions.ts` | `updateUser` Server Action (role + active state)                                                   |

## Scripts

```bash
pnpm dev          # development server
pnpm build        # production build
pnpm start        # run the production build
pnpm lint         # ESLint
pnpm format       # Prettier (with Tailwind class sorting)
pnpm format:check # Prettier check
```
