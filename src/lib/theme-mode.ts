export const THEME_MODE_STORAGE_KEY = "chihiro-theme-mode";
export const THEME_MODE_EVENT = "chihiro-theme-mode-change";

export const themeModes = ["light", "dark"] as const;
export const themeModePreferences = ["system", "light", "dark"] as const;

export type ThemeMode = (typeof themeModes)[number];
export type ThemeModePreference = (typeof themeModePreferences)[number];

type ThemeTransitionOptions = {
  origin?: {
    x: number;
    y: number;
  };
};

let themeTransitionTimers: number[] = [];

function shouldAnimateThemeTransition() {
  if (typeof window === "undefined") {
    return false;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }

  if (window.matchMedia("(max-width: 767px)").matches) {
    return false;
  }

  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) {
    return false;
  }

  return true;
}

export function getThemeMode(value?: string | null): ThemeMode {
  return value === "dark" ? "dark" : "light";
}

export function getThemeModePreference(value?: string | null): ThemeModePreference {
  if (value === "dark" || value === "light") {
    return value;
  }

  return "system";
}

export function getSystemThemeMode() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark" as ThemeMode;
  }

  return "light" as ThemeMode;
}

export function resolveThemeMode(preference: ThemeModePreference) {
  return preference === "system" ? getSystemThemeMode() : preference;
}

export function readStoredThemeModePreference() {
  if (typeof window === "undefined") {
    return "system" as ThemeModePreference;
  }

  return getThemeModePreference(window.localStorage.getItem(THEME_MODE_STORAGE_KEY));
}

export function readStoredThemeMode() {
  return resolveThemeMode(readStoredThemeModePreference());
}

export function applyStoredThemeMode() {
  if (typeof document === "undefined") {
    return;
  }

  const preference = readStoredThemeModePreference();
  const mode = resolveThemeMode(preference);

  document.documentElement.dataset.theme = mode;
  document.documentElement.dataset.themePreference = preference;
}

export function setThemeModePreference(mode: string) {
  const nextPreference = getThemeModePreference(mode);
  const nextMode = resolveThemeMode(nextPreference);

  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = nextMode;
    document.documentElement.dataset.themePreference = nextPreference;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, nextPreference);
    window.dispatchEvent(
      new CustomEvent(THEME_MODE_EVENT, {
        detail: nextPreference,
      }),
    );
  }

  return {
    preference: nextPreference,
    mode: nextMode,
  };
}

export function toggleThemeMode(currentMode: ThemeMode) {
  return setThemeModePreference(currentMode === "dark" ? "light" : "dark");
}

export function setThemeModePreferenceWithTransition(
  mode: string,
  options?: ThemeTransitionOptions,
) {
  const nextPreference = getThemeModePreference(mode);
  const nextMode = resolveThemeMode(nextPreference);

  if (typeof window === "undefined" || typeof document === "undefined") {
    return setThemeModePreference(nextPreference);
  }

  if (!shouldAnimateThemeTransition()) {
    return setThemeModePreference(nextPreference);
  }

  const origin = options?.origin ?? {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
  const root = document.documentElement;
  const body = document.body;

  root.dataset.themeTransitionState = "running";

  const existingAura = document.querySelector("[data-theme-transition-aura='true']");
  existingAura?.remove();
  themeTransitionTimers.forEach((timer) => window.clearTimeout(timer));
  themeTransitionTimers = [];

  const aura = document.createElement("span");
  aura.dataset.themeTransitionAura = "true";
  aura.dataset.nextMode = nextMode;
  aura.className = "theme-switch-aura";
  aura.style.setProperty("--theme-switch-origin-x", `${origin.x}px`);
  aura.style.setProperty("--theme-switch-origin-y", `${origin.y}px`);

  body.appendChild(aura);

  window.requestAnimationFrame(() => {
    aura.dataset.state = "visible";
  });

  themeTransitionTimers.push(window.setTimeout(() => {
    setThemeModePreference(nextPreference);
  }, 70));

  themeTransitionTimers.push(window.setTimeout(() => {
    aura.dataset.state = "fade";
  }, 360));

  themeTransitionTimers.push(window.setTimeout(() => {
    aura.remove();
    delete root.dataset.themeTransitionState;
    themeTransitionTimers = [];
  }, 760));

  return {
    preference: nextPreference,
    mode: nextMode,
  };
}

export function toggleThemeModeWithTransition(
  currentMode: ThemeMode,
  options?: ThemeTransitionOptions,
) {
  return setThemeModePreferenceWithTransition(
    currentMode === "dark" ? "light" : "dark",
    options,
  );
}

export function getThemeModeInitScript() {
  return `
    (() => {
      const storageKey = ${JSON.stringify(THEME_MODE_STORAGE_KEY)};
      const stored = window.localStorage.getItem(storageKey);
      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const nextMode = stored === "dark" || stored === "light"
        ? stored
        : stored === "system"
          ? "system"
          : "system";
      const resolvedMode = nextMode === "system"
        ? prefersDark
          ? "dark"
          : "light"
        : nextMode;

      document.documentElement.dataset.theme = resolvedMode;
      document.documentElement.dataset.themePreference = nextMode;
    })();
  `;
}
