"use client";

import { useEffect, useId, useMemo, useState } from "react";

type BulkSelectToggleProps = {
  formId: string;
  checkboxName: string;
};

export function BulkSelectToggle({ formId, checkboxName }: BulkSelectToggleProps) {
  const [checked, setChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const inputId = useId();

  const selector = useMemo(
    () => `input[type="checkbox"][name="${checkboxName}"][form="${formId}"]`,
    [checkboxName, formId],
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const syncState = () => {
      const checkboxes = Array.from(document.querySelectorAll<HTMLInputElement>(selector));
      const enabled = checkboxes.filter((checkbox) => !checkbox.disabled);
      const selectedCount = enabled.filter((checkbox) => checkbox.checked).length;

      setChecked(enabled.length > 0 && selectedCount === enabled.length);
      setIndeterminate(selectedCount > 0 && selectedCount < enabled.length);
    };

    syncState();
    document.addEventListener("change", syncState);

    return () => {
      document.removeEventListener("change", syncState);
    };
  }, [selector]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const input = document.getElementById(inputId) as HTMLInputElement | null;

    if (input) {
      input.indeterminate = indeterminate;
    }
  }, [indeterminate, inputId]);

  return (
    <input
      id={inputId}
      type="checkbox"
      checked={checked}
      aria-label="全选当前列表"
      onChange={(event) => {
        if (typeof document === "undefined") {
          return;
        }

        const nextChecked = event.currentTarget.checked;
        const checkboxes = Array.from(document.querySelectorAll<HTMLInputElement>(selector));

        for (const checkbox of checkboxes) {
          if (checkbox.disabled) {
            continue;
          }

          checkbox.checked = nextChecked;
          checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }}
      className="h-4 w-4 rounded-[5px] border-zinc-300 text-primary focus:ring-primary/30 dark:border-white/15"
    />
  );
}
