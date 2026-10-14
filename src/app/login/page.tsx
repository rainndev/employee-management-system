import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Welcome back to the employee management system.
        </p>

        <LoginForm />

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          No account yet?{" "}
          <Link
            href="/signup"
            className="font-medium text-foreground underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
