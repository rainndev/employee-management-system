import type { ReactNode } from "react";
import Link from "next/link";
import { UsersIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-[380px] animate-in duration-500 fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none">
        <header className="mb-12 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background shadow-sm">
              <UsersIcon className="size-4" strokeWidth={1.75} />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Employee System
            </span>
          </Link>
          <ThemeToggle />
        </header>

        {children}
      </div>
    </main>
  );
}
