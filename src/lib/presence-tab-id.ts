"use client";

const SITE_TAB_STORAGE_KEY = "chihiro:presence:tab";

export function getOrCreatePresenceTabId() {
  const existingTabId = window.sessionStorage.getItem(SITE_TAB_STORAGE_KEY);

  if (existingTabId) {
    return existingTabId;
  }

  const tabId = crypto.randomUUID();
  window.sessionStorage.setItem(SITE_TAB_STORAGE_KEY, tabId);
  return tabId;
}
