"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  THEME_MODE_EVENT,
  readStoredThemeModePreference,
  readStoredThemeMode,
  setThemeModePreferenceWithTransition,
  toggleThemeModeWithTransition,
  type ThemeMode,
  type ThemeModePreference,
} from "@/lib/theme-mode";

type ThemeModeToggleProps = {
  isScrolled?: boolean;
  inline?: boolean;
  disableTabFocus?: boolean;
  minimal?: boolean;
  hintPlacement?: "top" | "bottom";
};

export function ThemeModeToggle({
  isScrolled = false,
  inline = false,
  disableTabFocus = false,
  minimal = false,
  hintPlacement = "bottom",
}: ThemeModeToggleProps) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [preference, setPreference] = useState<ThemeModePreference>("system");
  const [isHintOpen, setIsHintOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncMode = (event?: Event) => {
      if (event instanceof CustomEvent && typeof event.detail === "string") {
        setPreference(
          event.detail === "light" || event.detail === "dark" ? event.detail : "system",
        );
        setMode(readStoredThemeMode());
        return;
      }

      setPreference(readStoredThemeModePreference());
      setMode(readStoredThemeMode());
    };

    syncMode();

    window.addEventListener(THEME_MODE_EVENT, syncMode as EventListener);
    window.addEventListener("storage", syncMode);
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      if (readStoredThemeModePreference() === "system") {
        setMode(readStoredThemeMode());
      }
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      window.removeEventListener(THEME_MODE_EVENT, syncMode as EventListener);
      window.removeEventListener("storage", syncMode);
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  useEffect(() => {
    if (inline) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (containerRef.current?.contains(target)) {
        return;
      }

      setIsHintOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [inline]);

  const handleToggle = () => {
    const button = containerRef.current?.querySelector("button");
    const nextState = toggleThemeModeWithTransition(mode, {
      origin: getRectCenter(button),
    });

    setPreference(nextState.preference);
    setMode(nextState.mode);
  };

  const handleFollowSystem = (target?: Element | null) => {
    const nextState = setThemeModePreferenceWithTransition("system", {
      origin: getRectCenter(target),
    });
    setPreference(nextState.preference);
    setMode(nextState.mode);
    setIsHintOpen(false);
  };

  if (inline) {
    return (
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={(event) => {
            const nextState = setThemeModePreferenceWithTransition("light", {
              origin: getRectCenter(event.currentTarget),
            });
            setPreference(nextState.preference);
            setMode(nextState.mode);
          }}
          className={`flex min-h-14 items-center justify-center gap-2 rounded-md border px-3 py-3 text-xs font-medium transition ${
            preference === "light"
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-zinc-200/80 bg-zinc-50/80 text-zinc-600 hover:border-zinc-300 hover:bg-white hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-950/80 dark:hover:text-zinc-100"
          }`}
        >
          <Sun className="h-4 w-4" />
          Light
        </button>
        <button
          type="button"
          onClick={(event) => {
            const nextState = setThemeModePreferenceWithTransition("dark", {
              origin: getRectCenter(event.currentTarget),
            });
            setPreference(nextState.preference);
            setMode(nextState.mode);
          }}
          className={`flex min-h-14 items-center justify-center gap-2 rounded-md border px-3 py-3 text-xs font-medium transition ${
            preference === "dark"
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-zinc-200/80 bg-zinc-50/80 text-zinc-600 hover:border-zinc-300 hover:bg-white hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-950/80 dark:hover:text-zinc-100"
          }`}
        >
          <Moon className="h-4 w-4" />
          Dark
        </button>
        <button
          type="button"
          onClick={(event) => handleFollowSystem(event.currentTarget)}
          className={`flex min-h-14 items-center justify-center gap-2 rounded-md border px-3 py-3 text-xs font-medium transition ${
            preference === "system"
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-zinc-200/80 bg-zinc-50/80 text-zinc-600 hover:border-zinc-300 hover:bg-white hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-950/80 dark:hover:text-zinc-100"
          }`}
        >
          <div className="flex h-4 w-4 items-center justify-center">
            <span className="h-2.5 w-2.5 rounded-full bg-current" />
          </div>
          System
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setIsHintOpen(true)}
      onMouseLeave={() => setIsHintOpen(false)}
      onFocusCapture={() => setIsHintOpen(true)}
      onBlurCapture={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
          setIsHintOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
        onClick={handleToggle}
        tabIndex={disableTabFocus ? -1 : undefined}
        className={`group inline-flex items-center justify-center rounded-2xl px-3 py-1.5 text-zinc-800 transition ${
          minimal
            ? "border border-transparent bg-transparent hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-white"
            : isScrolled
            ? "border border-zinc-200/80 bg-white/80 shadow-sm hover:border-primary/30 hover:text-primary hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:border-white/14 dark:bg-[rgba(255,255,255,0.06)] dark:text-zinc-100 dark:backdrop-blur-xl dark:backdrop-brightness-125 dark:backdrop-contrast-125 dark:shadow-[0_16px_40px_rgba(2,6,23,0.06)] dark:hover:shadow-[0_18px_36px_rgba(2,6,23,0.18)]"
            : "border border-transparent bg-transparent hover:text-primary dark:text-zinc-200"
        }`}
      >
        <span
          className="inline-flex items-center justify-center transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-12"
        >
          {mode === "dark" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
        </span>
      </button>

      {isHintOpen ? (
        <>
          <div
            aria-hidden="true"
            className={`absolute left-1/2 h-3 w-40 -translate-x-1/2 ${
              hintPlacement === "top" ? "bottom-full" : "top-full"
            }`}
          />
          <div
            className={`absolute left-1/2 w-48 -translate-x-1/2 rounded-md border border-zinc-200/80 bg-white/80 p-3 shadow-sm backdrop-blur-sm dark:border-white/14 dark:bg-[rgba(255,255,255,0.06)] dark:shadow-[0_18px_45px_rgba(2,6,23,0.06)] ${
              hintPlacement === "top" ? "bottom-[calc(100%+0.7rem)]" : "top-[calc(100%+0.7rem)]"
            }`}
          >
            <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Click the icon to switch mode, or{" "}
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => handleFollowSystem(event.currentTarget)}
                tabIndex={disableTabFocus ? -1 : undefined}
                className={`cursor-pointer text-xs font-medium transition ${
                  preference === "system"
                    ? "text-primary opacity-100"
                    : "text-primary hover:opacity-80"
                }`}
              >
                follow system
              </button>
              .
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}

function getRectCenter(element: Element | null | undefined) {
  const rect = element?.getBoundingClientRect();

  if (!rect) {
    return undefined;
  }

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}
