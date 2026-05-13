"use server";

import { signOut } from "@/server/public-auth";

export async function logoutAction() {
  await signOut({
    redirectTo: "/",
  });
}
