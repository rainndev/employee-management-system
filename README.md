# CoreHR

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + PostgreSQL (`pg`) + shadcn/ui.

## UI

The interface is built with [shadcn/ui](https://ui.shadcn.com) on the Radix base (`components.json` → `"style": "radix-nova"`). Components live in `src/components/ui/` and are plain source files you can edit.

The app shell comes from the [`dashboard-01`](https://ui.shadcn.com/blocks#dashboard-01) block: a collapsible sidebar (`src/components/app-sidebar.tsx`), a header (`src/components/site-header.tsx`), and section cards (`src/components/section-cards.tsx`). The block's placeholder content — Documents / Get Help navigation, the demo chart, the drag-and-drop table, and its mock data — was removed; the dashboard shows this app's real role-based metrics instead.

Installed: `button`, `input`, `label`, `textarea`, `select`, `calendar`, `popover`, `card`, `table`, `badge`, `alert`, `dialog`, `dropdown-menu`, `chart`, `toggle-group`, `avatar`, `separator`, `sheet`, `sidebar`, `skeleton`, `tooltip`.

Create and edit forms open in a `Dialog` (departments, positions, employees, and new leave requests). The dialog closes automatically when its action returns success. Date fields use a `DatePicker` (`src/components/date-picker.tsx`) — a `Popover` + shadcn `Calendar` that writes the chosen day into a hidden `YYYY-MM-DD` input for `FormData` submission.

Add another component with:

```bash
pnpm dlx shadcn@latest add <component>
```

Forms use shadcn `Input`, `Textarea` and `Select`. Radix `Select` renders a hidden native select for form submission, so Server Action `FormData` works; optional fields submit the `NONE_VALUE` sentinel (`__none__`), which the actions normalise back to an empty value. Theme tokens (`--background`, `--primary`, `--muted`, …) are defined in `src/app/globals.css`; dark mode uses the `.dark` class and is not wired to a toggle.

## Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL 13+ (pgAdmin 4)

## 1. Create the database and tables

> **Already have these tables?** Run every file in `db/migrations/` in order (or `pnpm db:migrate`). The migrations add timestamps, the leave-overlap constraint, leave balances, case-insensitive identity indexes, `session_version`, the audit log, the soft-delete-friendly employee indexes, and the past-date leave guard. Then jump to step 2.

Open **pgAdmin 4** and connect to your PostgreSQL server.

1. Create the database: right-click **Databases** → **Create** → **Database...** → name it `ems` → **Save**.
2. Open the Query Tool on `ems`: right-click the `ems` database → **Query Tool**.
3. Open `db/schema.sql` (File → Open, or paste it in) and press **F5** to execute.
4. Verify the tables: expand `ems` → **Schemas** → **public** → **Tables**. You should see 9 tables: `department`, `position`, `user`, `leave_type`, `employee`, `attendance`, `leave_request`, `leave_balance`, `audit_log`.

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

Load the reference data (leave types, sample departments, and sample positions) once:

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
| Leave — view | all | all | own + direct reports | own |
| Leave — file a request | anyone | anyone | own | own |
| Leave — approve/reject | ✅ | ✅ | own direct reports | — |
| Leave — cancel | any pending/approved | any pending/approved | own pending | own pending |
| Admin (users, roles, resets) | ✅ | — | — | — |

Permissions are enforced in `src/lib/dal.ts` (`requireRole`) and re-checked inside **every** Server Action — the UI hides links, but the server is the security boundary. Nobody can approve their own leave request; managers are restricted to their direct reports.

### Dashboard analytics

Each role sees four metrics on `/dashboard`, scoped to what they can act on:

| Role | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- |
| admin | Employees | Departments | Users | Pending leave |
| hr | Employees | Positions | Pending leave | Approved leave |
| manager | Team members | Pending approvals | Approved leave (team) | Upcoming leave (team) |
| employee | My requests | Pending | Approved | Days taken |

Counts come from `src/lib/analytics.ts`; manager metrics are scoped to employees whose `manager_id` is the manager's own employee record.

### Dashboard tables

Each dashboard also has a role-scoped table with a **View all** link:

| Role | Tables |
| --- | --- |
| admin | Employees (all) and Pending approvals (all) → `/employees`, `/leave` |
| hr | Employees (all) and Pending approvals (all) → `/employees`, `/leave` |
| manager | Team members and Pending approvals (direct reports only) → `/employees`, `/leave` |
| employee | My leave requests → `/leave` |

Manager directory and approval tables are filtered by `manager_id`; managers never receive full employee edit records on the dashboard.

Admins and managers also get a **Joined users** area chart under the cards — daily signups for the last 7 / 30 / 90 days, defaulting to 7 days (`src/components/signups-chart.tsx`).

### Leave requests need an employee record

Leave requests cannot start before the current business day (`Asia/Kuala_Lumpur`); this is enforced in the form, the Server Action, and a database trigger. `leave_request.approver_id` and `leave_request.employee_id` reference `employee(id)`. An account can only file leave (or approve it) when `employee.user_id` points at that account. Link a user to an employee from **Employees → Add employee → Linked user account**, or approve requests without that constraint by linking the approver too.

## SQL coverage

Every clause in the rubric is used in application code:

| Clause | Where |
| --- | --- |
| `SELECT` | all of `src/lib/*.ts` |
| `INSERT` | `createDepartment`, `createPosition`, `createEmployee`, `createLeaveRequest` |
| `UPDATE` | `updateDepartment`, `updatePosition`, `updateEmployee`, `setLeaveStatus`, soft deletes |
| `DELETE` | none — leave is cancelled, and employees/departments/positions use soft deletes |
| `WHERE` | every list/detail query, e.g. `deleted_at IS NULL`, `status = 'pending'` |
| `ORDER BY` | lists ordered by `name`, `title`, `last_name`, `start_date DESC` |
| `JOIN` | `listEmployees` (department, position), `listLeaveRequests` (employee, leave_type, approver), `listUserOptions` (LEFT JOIN … IS NULL) |

## Authentication

- **Signup** (`/signup`) inserts into `"user"` (`email`, `password_hash`, `role`) with bcrypt-hashed passwords. Emails are trimmed/lower-cased and unique case-insensitively. New accounts get the `employee` role. Set `SIGNUP_ALLOWED_DOMAINS` to restrict self-service signup to approved domains.
- **Login** (`/login`) verifies the bcrypt hash and rejects disabled accounts (`is_active = false`). Login and signup are rate-limited.
- **Session** is a signed JWT (HS256, `jose`) stored in an `httpOnly` cookie named `session`, valid for 7 days. The token holds the user id and a `session_version`; the role is read from the database on each request, so role and status changes apply immediately.
- **Dashboard** (`/dashboard`) reads the session via the data access layer in `src/lib/dal.ts`.

## Admin dashboard

`/admin` is restricted to `role = 'admin'`. It shows counts for employees, departments, positions, users, and pending leave requests, plus a user table where an admin can:

- change a user's role
- enable or disable an account
- **set a new password for a user** (bcrypt-hashed, same rules as signup: 8 to 72 characters with a letter and a number); this signs out the user's existing sessions

An admin cannot edit their own row. Everyone can change their own password from **Account → Change password**, which signs out other sessions. Share a reset password with the user directly — there is no email delivery.

### Self-service profile

Every signed-in user has a **Profile** page at `/profile`, linked from the user menu above **Change password**. Users can edit their sign-in email plus their own employee contact details (first/last name, phone, address, birthdate, and gender). Employment fields — employee number, department, position, manager, hire date, and status — remain read-only. Changing the sign-in email requires the current password. Accounts without a linked employee record can still update their email and are prompted to ask an administrator for a link.

Role changes and deactivations take effect on the target user's very next request, because `getCurrentUser()` re-reads `role` and `is_active` from the database instead of trusting the cookie. Password changes and admin resets bump `session_version`, so older cookies are rejected immediately.

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
| `src/lib/leave.ts`            | Leave types, balances, requests, overlap and approval rules                                          |
| `src/lib/admin.ts`            | Admin stats and user list queries                                                                    |
| `src/lib/definitions.ts`      | Zod schemas and form state types                                                                     |
| `src/lib/env.ts`              | Fail-fast environment validation                                                                     |
| `src/lib/rate-limit.ts`       | In-memory login/signup rate limiting                                                                 |
| `src/lib/audit.ts`            | Audit-log helper                                                                                     |
| `src/app/actions/auth.ts`     | `signup`, `login`, `logout` Server Actions                                                           |
| `src/components/ui/`           | shadcn/ui components (Button, Input, Select, Card, Table, Badge, Alert, Sidebar, …)                   |
| `src/components/app-sidebar.tsx` | Role-aware sidebar navigation                                                                      |
| `src/components/section-cards.tsx` | Dashboard metric cards                                                                          |
| `src/components/form-feedback.tsx` | Shared inline field errors and success/error alerts                                              |
| `src/app/(app)/layout.tsx`    | Sidebar shell + header for signed-in pages                                                            |
| `src/app/(app)/*/actions.ts`  | Per-module create/update/delete Server Actions                                                       |
| `src/app/(app)/admin/`        | Admin dashboard (roles, account status, password reset)                                              |
| `src/app/(app)/account/`      | Self-service password change                                                                         |
| `src/app/(app)/profile/`      | Self-service profile and contact details                                                             |
| `src/lib/profile.ts`          | Profile queries and self-service update transaction                                                 |

## Scripts

```bash
pnpm dev          # development server
pnpm build        # production build
pnpm test         # validation unit tests
pnpm test:e2e     # Playwright E2E (builds, then uses an isolated test database)
pnpm start        # run the production build
pnpm lint         # ESLint
pnpm format       # Prettier (with Tailwind class sorting)
pnpm format:check # Prettier check
pnpm db:schema    # apply db/schema.sql (fresh database)
pnpm db:migrate   # run db/migrations/*.sql in order (existing database)
```

Both database scripts read `DATABASE_URL` from `.env.local` and use `PSQL_PATH`, a standard PostgreSQL install path, or `psql` on `PATH` — in that order. Add `PSQL_PATH=...\psql.exe` to `.env.local` if it can't find `psql`.
