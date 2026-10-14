import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { logout } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading...</p>}>
        <Profile />
      </Suspense>
    </main>
  );
}

async function Profile() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as {user.email}
          </p>
        </div>
        {user.role === "admin" && (
          <Link
            href="/admin"
            className="text-sm font-medium whitespace-nowrap underline"
          >
            Admin dashboard
          </Link>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-lg border border-black/10 p-4 text-sm dark:border-white/15">
        <div>
          <dt className="text-zinc-500">User ID</dt>
          <dd className="font-mono break-all">{user.id}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Role</dt>
          <dd>{user.role}</dd>
        </div>
      </dl>

      <form action={logout}>
        <button
          type="submit"
          className="h-10 rounded-md border border-black/15 px-4 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/20 dark:hover:bg-white/[.06]"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
