"use client";

import { useActionState, useEffect, useState } from "react";
import {
  renderSubscriptionMailTemplate,
  splitTemplateParagraphs,
} from "@/lib/subscription-mail-templates";
import {
  saveSubscriptionTemplateAction,
  type SaveSubscriptionSettingsState,
} from "@/app/(admin)/admin/settings/subscriptions/actions";
import {
  subscriptionTemplateConfigs,
  type SubscriptionTemplateKey,
} from "@/app/(admin)/admin/settings/subscriptions/template-config";
import { useToast } from "@/components/toast-provider";

const initialState: SaveSubscriptionSettingsState = {
  error: null,
  success: null,
  nonce: 0,
};

export function TemplateSettingsForm({
  template,
  defaults,
  previewFooterLabel,
  previewAvatarUrl,
}: {
  template: SubscriptionTemplateKey;
  defaults: {
    subject: string;
    headline: string;
    body: string;
    ctaLabel: string;
  };
  previewFooterLabel: string;
  previewAvatarUrl: string | null;
}) {
  const [state, formAction] = useActionState(saveSubscriptionTemplateAction, initialState);
  const { showToast } = useToast();
  const config = subscriptionTemplateConfigs[template];
  const [subject, setSubject] = useState(defaults.subject);
  const [headline, setHeadline] = useState(defaults.headline);
  const [body, setBody] = useState(defaults.body);
  const [ctaLabel, setCtaLabel] = useState(defaults.ctaLabel);
  const previewSubject = renderSubscriptionMailTemplate(subject, config.previewVariables);
  const previewHeadline = renderSubscriptionMailTemplate(headline, config.previewVariables);
  const previewBody = renderSubscriptionMailTemplate(body, config.previewVariables);
  const previewCtaLabel = renderSubscriptionMailTemplate(ctaLabel, config.previewVariables);
  const previewParagraphs = splitTemplateParagraphs(previewBody);
  const previewSiteName = config.previewVariables.siteName;
  const previewPrimaryUrl =
    "confirmUrl" in config.previewVariables ? config.previewVariables.confirmUrl : config.previewVariables.url;
  const previewEyebrow =
    template === "confirm" ? "Email Subscription" : template === "post" ? "New Post" : "New Update";

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
    <form id="subscription-template-form" action={formAction} className="grid gap-10">
      <input type="hidden" name="template" value={template} />

      <section className="grid gap-5">
        <div className="grid gap-2">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{config.label}</h2>
          <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">{config.description}</p>
          <p className="text-xs leading-6 text-zinc-400 dark:text-zinc-500">
            可用变量：{config.variables.join("、")}
          </p>
        </div>

        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            邮件主题
          </span>
          <input
            name={config.fields.subject}
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
          />
        </label>

        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            邮件标题
          </span>
          <input
            name={config.fields.headline}
            type="text"
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            正文
          </span>
          <textarea
            name={config.fields.body}
            rows={7}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="min-h-44 rounded-2xl border border-zinc-200/80 bg-transparent px-4 py-3 text-sm leading-7 text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800/80 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
          />
          <span className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">
            支持变量替换；空行会拆成多个段落。
          </span>
        </label>

        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            按钮文案
          </span>
          <input
            name={config.fields.ctaLabel}
            type="text"
            value={ctaLabel}
            onChange={(event) => setCtaLabel(event.target.value)}
            className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
          />
        </label>
      </section>

      <section className="grid gap-5">
        <div className="grid gap-2">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">实时预览</h2>
          <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            这里按当前邮件模板的真实结构渲染一份示例，方便在保存前确认层级、节奏和最终观感。
          </p>
        </div>

        <div className="grid gap-5 rounded-[28px] bg-[#f5f5f4] p-6 dark:bg-zinc-950">
          <div className="grid gap-1 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              主题
            </p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{previewSubject}</p>
          </div>

          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_18px_40px_rgba(24,24,27,0.06)] dark:border-zinc-800 dark:bg-zinc-900">
              <div className="grid gap-5 p-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="inline-flex min-w-0 items-center gap-3">
                    {previewAvatarUrl ? (
                      <img
                        src={previewAvatarUrl}
                        alt={previewSiteName}
                        className="size-10 rounded-full object-cover"
                      />
                    ) : null}
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
                      {previewSiteName}
                    </p>
                  </div>

                  <div className="inline-flex shrink-0 items-center rounded-full border border-zinc-200 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    {previewEyebrow}
                  </div>
                </div>

                <h3 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-900 dark:text-zinc-100">
                  {previewHeadline}
                </h3>

                <div className="grid gap-3 text-base leading-8 text-zinc-600 dark:text-zinc-300">
                  {previewParagraphs.map((paragraph, index) => (
                    <p key={`${template}-preview-${index}`}>{paragraph}</p>
                  ))}
                </div>

                <div className="pt-1">
                  <span className="inline-flex items-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950">
                    {previewCtaLabel}
                  </span>
                </div>

                <div className="rounded-[18px] border border-[#f0ece7] bg-[#fafaf9] p-4 dark:border-zinc-800 dark:bg-zinc-950/80">
                  <p className="mb-2 text-[13px] leading-7 text-zinc-500 dark:text-zinc-400">
                    {template === "confirm"
                      ? "如果按钮无法点击，可以直接打开这个链接："
                      : "邮件里的按钮会跳到这里："}
                  </p>
                  <p className="break-all text-[13px] leading-7 text-zinc-900 underline underline-offset-2 dark:text-zinc-100">
                    {previewPrimaryUrl}
                  </p>
                </div>
              </div>

              <div className="border-t border-zinc-100 bg-[linear-gradient(180deg,rgba(250,250,249,0.65)_0%,rgba(255,255,255,1)_100%)] px-8 py-6 dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.35)_0%,rgba(24,24,27,0.9)_100%)]">
                <div className="flex items-center justify-between gap-4 text-[13px] leading-7 text-zinc-500 dark:text-zinc-400">
                  <p>{previewFooterLabel}</p>
                  <span className="text-[13px] font-medium text-zinc-700 underline underline-offset-2 dark:text-zinc-300">
                    退订
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}
