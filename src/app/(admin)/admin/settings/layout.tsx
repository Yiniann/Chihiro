import type { ReactNode } from "react";
import { SettingsShell } from "@/app/(admin)/admin/settings/settings-shell";

export default function AdminSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <SettingsShell>{children}</SettingsShell>;
}
