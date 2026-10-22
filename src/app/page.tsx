import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
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
