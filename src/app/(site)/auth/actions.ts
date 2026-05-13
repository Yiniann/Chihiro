"use server";

import { signOut } from "@/server/public-auth";

export async function signOutPublicUserAction() {
  await signOutSiteUserAction();
}

export async function signOutSiteUserAction() {
  await signOut();
}
