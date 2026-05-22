import type { ReactNode } from "react";
import { SettingsShell } from "@/app/(admin)/admin/settings/settings-shell";
import { requireOwnerSession } from "@/server/auth";

export default async function AdminSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireOwnerSession("/admin/settings");

  return <SettingsShell>{children}</SettingsShell>;
}
