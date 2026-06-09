"use client";

import type { ReactNode } from "react";
import { updateKindOptions, updateKindValues, type UpdateKindValue } from "@/lib/update-kind";

type UpdateSelectionStepperProps = {
  step: "choose" | "details";
  selectedKind: UpdateKindValue;
  onSelectKind: (kind: UpdateKindValue) => void;
  onBack: () => void;
  children?: ReactNode;
  chooseWidthClassName?: string;
  detailsWidthClassName?: string;
  hideKindsInChooseStep?: UpdateKindValue[];
  backLabel?: string;
};

export function UpdateSelectionStepper({
  step,
  selectedKind,
  onSelectKind,
  onBack,
  children,
  chooseWidthClassName = "w-[26rem] max-w-[calc(100vw-5rem)]",
  detailsWidthClassName = "w-[42rem] max-w-[calc(100vw-5rem)]",
  hideKindsInChooseStep = [],
  backLabel = "返回",
}: UpdateSelectionStepperProps) {
  if (step === "choose") {
    const visibleOptions = updateKindValues
      .filter((value) => !hideKindsInChooseStep.includes(value))
      .map((value) => updateKindOptions.find((option) => option.value === value))
      .filter((option): option is (typeof updateKindOptions)[number] => Boolean(option));

    return (
      <div className={chooseWidthClassName}>
        <div className="grid gap-3">
          {visibleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectKind(option.value)}
              className="rounded-[1.1rem] border border-zinc-200/80 bg-white px-4 py-4 text-left text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
            >
              <p className="text-sm font-medium">{option.label}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={detailsWidthClassName}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
          {updateKindOptions.find((option) => option.value === selectedKind)?.label ?? selectedKind}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          {backLabel}
        </button>
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}
