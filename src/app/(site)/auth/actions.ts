"use server";

import { clearAdminSession } from "@/server/auth";
import { signOut } from "@/server/public-auth";

export async function signOutPublicUserAction() {
  await signOutSiteUserAction();
}

export async function signOutSiteUserAction() {
  await clearAdminSession();
  await signOut();
}
