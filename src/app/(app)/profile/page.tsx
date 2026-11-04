import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/dal";
import { getMyProfile } from "@/lib/profile";
import { ProfileForm } from "./forms";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 lg:p-8">
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
      >
        <Content />
      </Suspense>
    </main>
  );
}

async function Content() {
  const user = await requireUser();
  const profile = await getMyProfile(user.id);

  if (!profile) {
    return (
      <p className="text-sm text-muted-foreground">
        Your profile could not be loaded. Sign in again.
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Profile
        </h1>
        <p className="mt-1 text-sm break-words text-muted-foreground">
          Manage your account and personal details.
        </p>
      </div>

      <ProfileForm profile={profile} />
    </div>
  );
}
