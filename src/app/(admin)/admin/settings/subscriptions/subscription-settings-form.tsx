"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import {
  saveSubscriptionSettingsAction,
  type SaveSubscriptionSettingsState,
} from "@/app/(admin)/admin/settings/subscriptions/actions";
import { subscriptionTemplateConfigs } from "@/app/(admin)/admin/settings/subscriptions/template-config";
import { SwitchField } from "@/app/(admin)/admin/settings/login-comments/login-comments-settings-form";
import { useToast } from "@/components/toast-provider";
import type { PublicInteractionSettingsRecord } from "@/server/repositories/public-interactions";

const initialState: SaveSubscriptionSettingsState = {
  error: null,
  success: null,
  nonce: 0,
};

export function SubscriptionSettingsForm({
  defaults,
}: {
  defaults: PublicInteractionSettingsRecord;
}) {
  const [state, formAction] = useActionState(saveSubscriptionSettingsAction, initialState);
  const [enabled, setEnabled] = useState(defaults.subscriptionsEnabled);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.error) {
      showToast(state.error, "error");
      return;
    }

    if (state.success) {
      showToast(state.success);
    }
  }, [showToast, state.error, state.nonce, state.success]);

  return (
    <form id="subscription-settings-form" action={formAction} className="grid gap-8">
      <input type="hidden" name="subscriptionsEnabled" value={enabled ? "true" : "false"} />

      <section className="grid gap-8">
        <div className="grid gap-3">
          <SwitchField
            title="启用订阅"
            description="开启订阅功能"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        <section className="grid gap-4">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">邮件模板</h2>

          <div className="grid gap-3">
            {Object.entries(subscriptionTemplateConfigs).map(([key, item]) => (
              <Link
                key={key}
                href={item.href}
                className="group flex items-center justify-between gap-4 rounded-3xl border border-zinc-200/80 p-5 transition hover:border-zinc-400 hover:bg-zinc-50/70 dark:border-zinc-800/80 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60"
              >
                <div className="grid gap-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.label}</p>
                  <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                    {item.description}
                  </p>
                </div>

                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition group-hover:border-zinc-400 group-hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-500 dark:group-hover:border-zinc-700 dark:group-hover:text-zinc-300">
                  <ChevronRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </form>
  );
}
