import { Suspense } from "react";
import { Nav } from "./nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense
        fallback={
          <header className="border-b">
            <div className="mx-auto h-12 max-w-5xl px-6" />
          </header>
        }
      >
        <Nav />
      </Suspense>
      {children}
    </>
  );
}
