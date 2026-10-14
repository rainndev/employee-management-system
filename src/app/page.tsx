import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Employee Management System
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in, or create an account to get started.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/login"
          className="flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="flex h-10 items-center rounded-md border border-black/15 px-4 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/20 dark:hover:bg-white/[.06]"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
