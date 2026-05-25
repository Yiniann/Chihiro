"use client";

import { useActionState, useEffect } from "react";
import {
  saveEmailSettingsAction,
  sendTestEmailAction,
  type SaveEmailSettingsState,
  type SendTestEmailState,
} from "@/app/(admin)/admin/settings/email/actions";
import { useToast } from "@/components/toast-provider";

const initialSaveState: SaveEmailSettingsState = {
  error: null,
  success: null,
  nonce: 0,
};

const initialTestState: SendTestEmailState = {
  error: null,
  success: null,
  nonce: 0,
};

type EmailSettingsFormProps = {
  defaults: {
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpFromEmail: string;
    smtpFromName: string;
    subscriptionReplyTo: string;
    hasSmtpPass: boolean;
  };
};

export function EmailSettingsForm({ defaults }: EmailSettingsFormProps) {
  const [saveState, saveAction] = useActionState(saveEmailSettingsAction, initialSaveState);
  const [testState, testAction] = useActionState(sendTestEmailAction, initialTestState);

  useSettingsToast(saveState);
  useSettingsToast(testState);

  return (
    <div className="grid gap-10">
      <form id="email-settings-form" action={saveAction} className="grid gap-6">
        <section className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              当前阶段使用 SMTP 作为统一发信通道。保存后可在下方发送测试邮件，确认服务商配置、认证信息和发件人是否可用。
            </p>
          </div>

          <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              SMTP 主机
            </span>
            <input
              name="smtpHost"
              type="text"
              required
              defaultValue={defaults.smtpHost}
              className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
              placeholder="smtp.example.com"
            />
          </label>

          <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              SMTP 端口
            </span>
            <input
              name="smtpPort"
              type="number"
              min="1"
              max="65535"
              required
              defaultValue={String(defaults.smtpPort)}
              className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
              placeholder="587"
            />
          </label>

          <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              SMTP 用户名
            </span>
            <input
              name="smtpUser"
              type="text"
              required
              defaultValue={defaults.smtpUser}
              className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
              placeholder="no-reply@example.com"
            />
          </label>

          <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              SMTP 密码
            </span>
            <input
              name="smtpPass"
              type="password"
              required={!defaults.hasSmtpPass}
              className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
              placeholder={defaults.hasSmtpPass ? "留空保持现有密码" : "SMTP 密码或授权码"}
            />
          </label>

          <div className="md:col-span-2">
            <label className="flex items-start gap-3">
              <input
                name="smtpSecure"
                type="checkbox"
                value="1"
                defaultChecked={defaults.smtpSecure}
                className="mt-1 size-4"
              />
              <span className="grid gap-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  使用 TLS 直连
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  通常端口 `465` 需要开启；端口 `587` 一般关闭并通过 STARTTLS 升级。
                </span>
              </span>
            </label>
          </div>

          <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              发件邮箱
            </span>
            <input
              name="smtpFromEmail"
              type="email"
              required
              defaultValue={defaults.smtpFromEmail}
              className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
              placeholder="no-reply@example.com"
            />
          </label>

          <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              发件人名称
            </span>
            <input
              name="smtpFromName"
              type="text"
              defaultValue={defaults.smtpFromName}
              className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
              placeholder="Chihiro"
            />
          </label>

          <div className="md:col-span-2">
            <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
              <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                回复邮箱
              </span>
              <input
                name="subscriptionReplyTo"
                type="email"
                defaultValue={defaults.subscriptionReplyTo}
                className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
                placeholder="hello@example.com"
              />
              <span className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                可选。订阅确认、通知邮件被回复时，优先投递到这个地址。
              </span>
            </label>
          </div>
        </section>
      </form>

      <form action={testAction} className="grid gap-4 rounded-3xl border border-zinc-200/80 p-5 dark:border-zinc-800/80">
        <div className="grid gap-1">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">测试发信</h2>
          <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            建议先保存 SMTP 配置，再发送一封测试邮件验证连接、认证和发件箱权限。
          </p>
        </div>

        <label className="grid gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            测试收件邮箱
          </span>
          <input
            name="testRecipient"
            type="email"
            required
            className="h-11 border-b border-zinc-200/80 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:border-zinc-800/80 dark:text-zinc-200 dark:placeholder:text-zinc-600"
            placeholder="you@example.com"
          />
        </label>

        <div className="flex justify-start">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-100 dark:hover:text-zinc-50"
          >
            发送测试邮件
          </button>
        </div>
      </form>
    </div>
  );
}

function useSettingsToast(state: { error: string | null; success: string | null; nonce: number }) {
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
}
