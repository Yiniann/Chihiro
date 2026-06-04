"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toggleProjectVisibilityAction } from "@/app/(admin)/admin/projects/actions";
import { useToast } from "@/components/toast-provider";

export function ProjectActionMenu({
  projectSlug,
  hidden,
  compact = false,
}: {
  projectSlug: string;
  hidden: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
        return;
      }

      if (!target || menuRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={[
          "inline-flex items-center gap-1.5 border-b border-transparent px-0 py-1 font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100",
          compact ? "text-xs" : "text-sm",
        ].join(" ")}
        aria-label="更多操作"
      >
        操作
        <ChevronDown
          className={`h-3.5 w-3.5 transition duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-10 mt-2 min-w-[8rem] overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-1 shadow-[0_14px_40px_rgba(15,23,42,0.08)] dark:border-zinc-800/90 dark:bg-zinc-950 dark:shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
          <form
            action={toggleProjectVisibilityAction}
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);

              startTransition(async () => {
                await toggleProjectVisibilityAction(formData);
                showToast(hidden ? "已恢复显示项目" : "已隐藏项目");
                setIsOpen(false);
                router.refresh();
              });
            }}
          >
            <input type="hidden" name="projectSlug" value={projectSlug} />
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            >
              {isPending ? "处理中..." : hidden ? "恢复显示" : "隐藏项目"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
