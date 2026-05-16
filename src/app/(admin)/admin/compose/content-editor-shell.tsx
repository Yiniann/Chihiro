"use client";

import { X } from "lucide-react";
import type { ReactNode, RefObject } from "react";

type ContentEditorShellProps = {
  formAction: (formData: FormData) => void;
  formRef?: RefObject<HTMLFormElement | null>;
  onSubmit?: () => void;
  hiddenFields: ReactNode;
  main: ReactNode;
  sidebar: ReactNode;
  stateError: string | null;
  footerLeft: ReactNode;
  footerRight: ReactNode;
  topBar?: ReactNode;
  sidebarMode?: "sticky" | "drawer";
  sidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
  sidebarTitle?: string;
};

export function ContentEditorShell({
  formAction,
  formRef,
  onSubmit,
  hiddenFields,
  main,
  sidebar,
  stateError,
  footerLeft,
  footerRight,
  topBar,
  sidebarMode = "sticky",
  sidebarOpen = false,
  onSidebarOpenChange,
  sidebarTitle = "设置",
}: ContentEditorShellProps) {
  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      className="flex h-full min-h-[calc(100dvh-2rem)] flex-col gap-6 pb-0 md:min-h-[calc(100dvh-3rem)]"
    >
      {hiddenFields}
      {topBar}

      <section
        className={
          sidebarMode === "drawer"
            ? "grid min-h-0 flex-1 gap-10"
            : "grid min-h-0 flex-1 gap-10 lg:min-h-[calc(100dvh-20rem)] lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-14"
        }
      >
        <div className="grid gap-8">{main}</div>
        {sidebarMode === "sticky" ? (
          <aside className="grid gap-8 lg:sticky lg:top-28">{sidebar}</aside>
        ) : null}
      </section>

      {sidebarMode === "drawer" ? (
        <>
          <div
            className={`fixed inset-0 z-30 bg-zinc-950/24 backdrop-blur-[1px] transition ${
              sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden="true"
            onClick={() => onSidebarOpenChange?.(false)}
          />
          <aside
            className={`fixed right-0 top-0 z-40 flex h-dvh w-full max-w-[24rem] flex-col border-l border-zinc-200/80 bg-white/96 shadow-[0_30px_90px_rgba(15,23,42,0.16)] backdrop-blur transition-transform dark:border-zinc-800/80 dark:bg-zinc-950/96 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)] ${
              sidebarOpen ? "translate-x-0" : "translate-x-full"
            }`}
            aria-hidden={!sidebarOpen}
          >
            <div className="flex items-center justify-between border-b border-zinc-200/80 px-5 py-4 dark:border-zinc-800/80">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                  Panel
                </p>
                <h2 className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {sidebarTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSidebarOpenChange?.(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:bg-[rgb(var(--primary-rgb)/0.08)] hover:text-primary dark:text-zinc-400"
                aria-label="关闭设置栏"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="grid gap-8">{sidebar}</div>
            </div>
          </aside>
        </>
      ) : null}

      {stateError ? (
        <p className="border-l-2 border-rose-300 pl-4 text-sm text-rose-700 dark:border-rose-400/40 dark:text-rose-200">
          {stateError}
        </p>
      ) : null}

      <div className="sticky bottom-[-1rem] z-20 mt-auto -mx-4 -mb-4 flex flex-col gap-3 border-t border-zinc-200/80 bg-white/92 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/78 dark:border-zinc-800/80 dark:bg-zinc-950/92 supports-[backdrop-filter]:dark:bg-zinc-950/78 md:-mx-6 md:-mb-6 md:bottom-[-1.5rem] md:px-6 md:py-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center">{footerLeft}</div>
        <div className="grid w-full grid-cols-3 gap-2 lg:flex lg:w-auto lg:items-center">{footerRight}</div>
      </div>
    </form>
  );
}
