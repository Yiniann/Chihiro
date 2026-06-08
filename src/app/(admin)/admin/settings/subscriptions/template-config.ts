import { subscriptionMailTemplateVariableHints } from "@/lib/subscription-mail-templates";
import type { PublicInteractionSettingsRecord } from "@/server/repositories/public-interactions";

export const subscriptionTemplateConfigs = {
  confirm: {
    label: "确认订阅邮件",
    description: "用户提交邮箱后收到的确认邮件。适合说明订阅目的、确认动作，以及后续会收到什么。",
    href: "/admin/settings/subscriptions/confirm",
    variables: subscriptionMailTemplateVariableHints.subscriptionConfirm,
    previewVariables: {
      siteName: "Chihiro",
      confirmUrl: "https://chihiro.example/subscribe/confirm?token=demo-confirm-token",
      unsubscribeUrl: "https://chihiro.example/unsubscribe?token=demo-unsubscribe-token",
    },
    fields: {
      subject: "subscriptionConfirmSubject",
      headline: "subscriptionConfirmHeadline",
      body: "subscriptionConfirmBody",
      ctaLabel: "subscriptionConfirmCtaLabel",
    } as const,
  },
  post: {
    label: "文章通知邮件",
    description: "文章首次发布后发给勾选了“文章订阅”的订阅者。正文建议保持简洁，把细节交给文章页面。",
    href: "/admin/settings/subscriptions/post",
    variables: subscriptionMailTemplateVariableHints.postNotification,
    previewVariables: {
      siteName: "Chihiro",
      title: "把发布系统真正接进订阅邮件",
      summary: "这篇文章记录了从订阅确认到文章通知、动态通知的完整落地过程，以及为什么把模板配置放进订阅设置里更合理。",
      url: "https://chihiro.example/posts/build-logs/subscription-mail-rollout",
      unsubscribeUrl: "https://chihiro.example/unsubscribe?token=demo-unsubscribe-token",
    },
    fields: {
      subject: "postNotificationSubject",
      headline: "postNotificationHeadline",
      body: "postNotificationBody",
      ctaLabel: "postNotificationCtaLabel",
    } as const,
  },
  update: {
    label: "动态通知邮件",
    description: "动态发布后发给勾选了“动态订阅”的订阅者。更适合短消息、进度播报和更新摘要。",
    href: "/admin/settings/subscriptions/update",
    variables: subscriptionMailTemplateVariableHints.updateNotification,
    previewVariables: {
      siteName: "Chihiro",
      title: "订阅模板页已支持实时预览",
      summary: "现在进入模板详情页时，可以边改边看主题、正文和按钮文案会怎么显示，不用反复保存猜效果。",
      url: "https://chihiro.example/updates#update-128",
      unsubscribeUrl: "https://chihiro.example/unsubscribe?token=demo-unsubscribe-token",
    },
    fields: {
      subject: "updateNotificationSubject",
      headline: "updateNotificationHeadline",
      body: "updateNotificationBody",
      ctaLabel: "updateNotificationCtaLabel",
    } as const,
  },
} as const;

export type SubscriptionTemplateKey = keyof typeof subscriptionTemplateConfigs;

export function isSubscriptionTemplateKey(value: string): value is SubscriptionTemplateKey {
  return value in subscriptionTemplateConfigs;
}

export function getSubscriptionTemplateDefaults(
  settings: PublicInteractionSettingsRecord,
  key: SubscriptionTemplateKey,
) {
  const fields = subscriptionTemplateConfigs[key].fields;

  return {
    subject: settings[fields.subject],
    headline: settings[fields.headline],
    body: settings[fields.body],
    ctaLabel: settings[fields.ctaLabel],
  };
}
