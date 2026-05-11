"use server";

import { signIn, signOut } from "@/server/public-auth";

export async function signInWithGitHubAction() {
  await signIn("github");
}

export async function signOutPublicUserAction() {
  await signOut();
}
