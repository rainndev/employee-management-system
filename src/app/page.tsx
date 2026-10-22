import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Employee Management System
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in, or create an account to get started.
        </p>
      </div>

      <div className="flex gap-3">
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/signup">Sign up</Link>
        </Button>
      </div>
    </main>
  );
}
