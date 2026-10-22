# Employee Management System

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + PostgreSQL (`pg`) + shadcn/ui.

## UI

The interface is built with [shadcn/ui](https://ui.shadcn.com) on the Radix base (`components.json` → `"style": "radix-nova"`). Components live in `src/components/ui/` and are plain source files you can edit.

The app shell comes from the [`dashboard-01`](https://ui.shadcn.com/blocks#dashboard-01) block: a collapsible sidebar (`src/components/app-sidebar.tsx`), a header (`src/components/site-header.tsx`), and section cards (`src/components/section-cards.tsx`). The block's placeholder content — Documents / Get Help navigation, the demo chart, the drag-and-drop table, and its mock data — was removed; the dashboard shows this app's real role-based metrics instead.

Installed: `button`, `input`, `label`, `textarea`, `native-select`, `card`, `table`, `badge`, `alert`, `dialog`, `avatar`, `separator`, `sheet`, `sidebar`, `skeleton`, `tooltip`.

Create and edit forms open in a `Dialog` (departments, positions, employees, and new leave requests). The dialog closes automatically when its action returns success.

Add another component with:

```bash
pnpm dlx shadcn@latest add <component>
```

Forms use shadcn `Input`, `Textarea` and `NativeSelect` (a real `<select>`, so Server Action `FormData` submission keeps working without JavaScript). Theme tokens (`--background`, `--primary`, `--muted`, …) are defined in `src/app/globals.css`; dark mode uses the `.dark` class and is not wired to a toggle.

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

Load the reference data (leave types) once:

```bash
psql "$DATABASE_URL" -f db/seed.sql
```

Or paste `db/seed.sql` into pgAdmin's Query Tool and press **F5**.

## Features and role-based access

| Feature | admin | hr | manager | employee |
| --- | :-: | :-: | :-: | :-: |
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Departments — view | ✅ | ✅ | ✅ | ✅ |
| Departments — create/edit/delete | ✅ | ✅ | — | — |
| Positions — view | ✅ | ✅ | ✅ | ✅ |
| Positions — create/edit/delete | ✅ | ✅ | — | — |
| Employees — view | ✅ | ✅ | ✅ | — |
| Employees — create/edit/delete | ✅ | ✅ | — | — |
| Leave — view | all | all | all | own |
| Leave — file a request | anyone | anyone | own | own |
| Leave — approve/reject | ✅ | ✅ | ✅ | — |
| Leave — delete | any | any | own pending | own pending |
| Admin (users, roles, resets) | ✅ | — | — | — |

Permissions are enforced in `src/lib/dal.ts` (`requireRole`) and re-checked inside **every** Server Action — the UI hides links, but the server is the security boundary.

### Dashboard analytics

Each role sees four metrics on `/dashboard`, scoped to what they can act on:

| Role | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- |
| admin | Employees | Departments | Users | Pending leave |
| hr | Employees | Positions | Pending leave | Approved leave |
| manager | Team members | Pending approvals | Approved leave (team) | Upcoming leave (team) |
| employee | My requests | Pending | Approved | Days taken |

Counts come from `src/lib/analytics.ts`; manager metrics are scoped to employees whose `manager_id` is the manager's own employee record.

### Leave requests need an employee record

`leave_request.approver_id` and `leave_request.employee_id` reference `employee(id)`. An account can only file leave (or approve it) when `employee.user_id` points at that account. Link a user to an employee from **Employees → Add employee → Linked user account**, or approve requests without that constraint by linking the approver too.

## SQL coverage

Every clause in the rubric is used in application code:

| Clause | Where |
| --- | --- |
| `SELECT` | all of `src/lib/*.ts` |
| `INSERT` | `createDepartment`, `createPosition`, `createEmployee`, `createLeaveRequest` |
| `UPDATE` | `updateDepartment`, `updatePosition`, `updateEmployee`, `setLeaveStatus`, soft deletes |
| `DELETE` | `deleteLeaveRequest` |
| `WHERE` | every list/detail query, e.g. `deleted_at IS NULL`, `status = 'pending'` |
| `ORDER BY` | lists ordered by `name`, `title`, `last_name`, `start_date DESC` |
| `JOIN` | `listEmployees` (department, position), `listLeaveRequests` (employee, leave_type, approver), `listUserOptions` (LEFT JOIN … IS NULL) |

## Authentication

- **Signup** (`/signup`) inserts into `"user"` (`email`, `password_hash`, `role`) with bcrypt-hashed passwords. New accounts get the `employee` role.
- **Login** (`/login`) verifies the bcrypt hash and rejects disabled accounts (`is_active = false`).
- **Session** is a signed JWT (HS256, `jose`) stored in an `httpOnly` cookie named `session`, valid for 7 days. The token holds **only the user id** — the role is read from the database on each request, so role and status changes apply immediately.
- **Dashboard** (`/dashboard`) reads the session via the data access layer in `src/lib/dal.ts`.

## Admin dashboard

`/admin` is restricted to `role = 'admin'`. It shows counts for employees, departments, positions, users, and pending leave requests, plus a user table where an admin can:

- change a user's role
- enable or disable an account
- **set a new password for a user** (bcrypt-hashed, same rules as signup: 8+ characters with a letter and a number)

An admin cannot edit their own row, so they cannot lock themselves out. Share a reset password with the user directly — there is no email delivery.

Role changes and deactivations take effect on the target user's very next request, because `getCurrentUser()` re-reads `role` and `is_active` from the database instead of trusting the cookie. A password reset does **not** end the target's existing session; see the note below.

### Password resets do not end existing sessions

Sessions are stateless: the cookie holds a signed user id valid for 7 days. Changing `password_hash` does not invalidate an already-issued cookie, so if the account was compromised, the intruder keeps access until the cookie expires.

To close that gap, add a token version to the user table, include it in the session cookie, and reject cookies whose version is stale:

```sql
ALTER TABLE "user" ADD COLUMN session_version integer NOT NULL DEFAULT 0;
```

Then bump `session_version` on password reset and compare it in `getCurrentUser()`. Until then, disable the account instead — disabling takes effect immediately.

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
| `db/seed.sql`                 | Reference data (leave types)                                                                         |
| `src/lib/db.ts`               | Shared `pg` connection pool                                                                          |
| `src/lib/session.ts`          | JWT sign/verify and session cookie helpers                                                           |
| `src/lib/dal.ts`              | `getCurrentUser()` / `requireUser()` / `requireRole()` / `requireAdmin()`                            |
| `src/lib/roles.ts`            | Role constants, plus `canManage()` and `canApprove()`                                                |
| `src/lib/departments.ts`      | Department queries (list, insert, update, soft delete)                                               |
| `src/lib/positions.ts`        | Position queries                                                                                     |
| `src/lib/employees.ts`        | Employee queries with JOINs, options, soft delete                                                    |
| `src/lib/leave.ts`            | Leave types and leave request queries                                                                |
| `src/lib/admin.ts`            | Admin stats and user list queries                                                                    |
| `src/lib/definitions.ts`      | Zod schemas and form state types                                                                     |
| `src/app/actions/auth.ts`     | `signup`, `login`, `logout` Server Actions                                                           |
| `src/components/ui/`           | shadcn/ui components (Button, Input, NativeSelect, Card, Table, Badge, Alert, Sidebar, …)             |
| `src/components/app-sidebar.tsx` | Role-aware sidebar navigation                                                                      |
| `src/components/section-cards.tsx` | Dashboard metric cards                                                                          |
| `src/components/form-feedback.tsx` | Shared inline field errors and success/error alerts                                              |
| `src/app/(app)/layout.tsx`    | Sidebar shell + header for signed-in pages                                                            |
| `src/app/(app)/*/actions.ts`  | Per-module create/update/delete Server Actions                                                       |
| `src/app/(app)/admin/`        | Admin dashboard (roles, account status, password reset)                                              |

## Scripts

```bash
pnpm dev          # development server
pnpm build        # production build
pnpm start        # run the production build
pnpm lint         # ESLint
pnpm format       # Prettier (with Tailwind class sorting)
pnpm format:check # Prettier check
```
