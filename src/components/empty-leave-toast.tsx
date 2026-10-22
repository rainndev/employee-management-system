"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function EmptyLeaveToast({ linked }: { linked: boolean }) {
  useEffect(() => {
    toast.info("No leave requests yet", {
      id: "empty-leave-requests",
      description: linked
        ? "Submit a request from the Leave page."
        : "Your account is not linked to an employee record yet.",
    });
  }, [linked]);

  return null;
}
