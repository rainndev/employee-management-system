"use server";

import { refresh } from "next/cache";
import * as z from "zod";
import { requireUser } from "@/lib/dal";
import { optionalString } from "@/lib/constants";
import {
  getMyProfile,
  ProfileBirthdateError,
  ProfilePasswordError,
  updateMyProfile,
  type ProfileEmployeeInput,
} from "@/lib/profile";
import {
  AccountProfileSchema,
  ProfileEmployeeSchema,
  type ProfileState,
} from "@/lib/definitions";

export async function saveProfile(
  _state: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const user = await requireUser();
  const profile = await getMyProfile(user.id);

  if (!profile) {
    return { message: "Your account could not be loaded. Sign in again." };
  }

  const account = AccountProfileSchema.safeParse({
    email: formData.get("email"),
    currentPassword: String(formData.get("currentPassword") ?? ""),
  });

  if (!account.success) {
    return { errors: z.flattenError(account.error).fieldErrors };
  }

  let employee: ProfileEmployeeInput | null = null;

  if (profile.employee) {
    const parsed = ProfileEmployeeSchema.safeParse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      phone: formData.get("phone") ?? "",
      address: formData.get("address") ?? "",
      birthdate: formData.get("birthdate") ?? "",
      gender: optionalString(formData.get("gender")),
    });

    if (!parsed.success) {
      return { errors: z.flattenError(parsed.error).fieldErrors };
    }

    employee = {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      address: parsed.data.address,
      birthdate: parsed.data.birthdate || null,
      gender: parsed.data.gender || null,
    };
  }

  try {
    await updateMyProfile(user.id, {
      email: account.data.email,
      currentPassword: account.data.currentPassword ?? "",
      employee,
    });
  } catch (error) {
    if (error instanceof ProfilePasswordError) {
      return { errors: { currentPassword: [error.message] } };
    }

    if (error instanceof ProfileBirthdateError) {
      return { errors: { birthdate: [error.message] } };
    }

    console.error("saveProfile failed:", error);

    if ((error as { code?: string }).code === "23505") {
      return {
        errors: { email: ["That email is already in use by another account."] },
      };
    }

    return { message: "Could not save your profile." };
  }

  refresh();
  return { success: true, message: "Profile updated." };
}
