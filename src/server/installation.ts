import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { hasDatabaseUrl } from "@/server/db/client";
import {
  isDatabaseSchemaMissingError,
  isDatabaseUnavailableError,
} from "@/server/database-errors";
import { countAdminUsers } from "@/server/repositories/admin-auth";
import { getSiteSettings } from "@/server/repositories/site";

export type InstallationStatus =
  | "missing_database"
  | "database_unavailable"
  | "schema_missing"
  | "ready";

export type InstallationState = {
  installed: boolean;
  status: InstallationStatus;
  adminUserCount: number;
  hasSiteSettings: boolean;
};

const INSTALL_STATE_PATH = path.join(
  /*turbopackIgnore: true*/ process.cwd(),
  ".runtime",
  "install-state.json",
);

export async function getInstallationState(): Promise<InstallationState> {
  const markerEnabled = isInstallMarkerEnabled();
  const installed = markerEnabled ? await hasInstallMarker() : true;

  if (!hasDatabaseUrl()) {
    return {
      installed,
      status: "missing_database",
      adminUserCount: 0,
      hasSiteSettings: false,
    };
  }

  try {
    const [adminUserCount, siteSettings] = await Promise.all([
      countAdminUsers(),
      getSiteSettings(),
    ]);
    const hasSiteSettings = Boolean(siteSettings);

    return {
      installed,
      status: "ready",
      adminUserCount,
      hasSiteSettings,
    };
  } catch (error) {
    if (isDatabaseSchemaMissingError(error)) {
      return {
        installed,
        status: "schema_missing",
        adminUserCount: 0,
        hasSiteSettings: false,
      };
    }

    if (isDatabaseUnavailableError(error)) {
      return {
        installed,
        status: "database_unavailable",
        adminUserCount: 0,
        hasSiteSettings: false,
      };
    }

    throw error;
  }
}

export function isInstallationComplete(state: InstallationState) {
  return state.installed;
}

export async function hasInstallMarker() {
  try {
    const raw = await readFile(INSTALL_STATE_PATH, "utf8");
    const parsed = JSON.parse(raw) as { installed?: boolean };
    return parsed.installed === true;
  } catch {
    return false;
  }
}

export async function markInstallationComplete() {
  if (!isInstallMarkerEnabled()) {
    return;
  }

  await mkdir(path.dirname(INSTALL_STATE_PATH), { recursive: true });
  await writeFile(
    INSTALL_STATE_PATH,
    JSON.stringify(
      {
        installed: true,
        installedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf8",
  );
}

function isInstallMarkerEnabled() {
  return process.env.NODE_ENV === "production";
}
