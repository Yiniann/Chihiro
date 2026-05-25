"use client";

import { useActionState, useEffect, useState } from "react";
import {
  saveSubscriptionSettingsAction,
  type SaveSubscriptionSettingsState,
} from "@/app/(admin)/admin/settings/subscriptions/actions";
import { SwitchField } from "@/app/(admin)/admin/settings/login-comments/login-comments-settings-form";
import { useToast } from "@/components/toast-provider";

const initialState: SaveSubscriptionSettingsState = {
  error: null,
  success: null,
  nonce: 0,
};

export function SubscriptionSettingsForm({
  defaultEnabled,
}: {
  defaultEnabled: boolean;
}) {
  const [state, formAction] = useActionState(saveSubscriptionSettingsAction, initialState);
  const [enabled, setEnabled] = useState(defaultEnabled);
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
            description="开启后，页脚的 Subscribe 和文章侧边栏的订阅按钮打开后开启订阅模态框；关闭后，前台会保留入口样式但不允许提交订阅。"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
      </section>
    </form>
  );
}
