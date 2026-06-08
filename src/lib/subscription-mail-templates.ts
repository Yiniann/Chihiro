export const subscriptionMailTemplateDefaults = {
  subscriptionConfirmSubject: "确认订阅 {{siteName}}",
  subscriptionConfirmHeadline: "确认你的邮件订阅",
  subscriptionConfirmBody:
    "你刚刚提交了 {{siteName}} 的邮件订阅请求。\n\n点一下下面的按钮完成确认。之后如果有新的动态、更新或发布内容，我们会把它安静地送到你的邮箱里。",
  subscriptionConfirmCtaLabel: "确认订阅",
  postNotificationSubject: "[{{siteName}}] New Content Published",
  postNotificationHeadline: "{{title}}",
  postNotificationBody: "{{summary}}",
  postNotificationCtaLabel: "阅读这篇文章",
  updateNotificationSubject: "[{{siteName}}] New Content Published",
  updateNotificationHeadline: "{{title}}",
  updateNotificationBody: "{{summary}}",
  updateNotificationCtaLabel: "查看这条动态",
} as const;

export const subscriptionMailTemplateVariableHints = {
  subscriptionConfirm: ["{{siteName}}", "{{confirmUrl}}", "{{unsubscribeUrl}}"],
  postNotification: ["{{siteName}}", "{{title}}", "{{summary}}", "{{url}}", "{{unsubscribeUrl}}"],
  updateNotification: ["{{siteName}}", "{{title}}", "{{summary}}", "{{url}}", "{{unsubscribeUrl}}"],
} as const;

export function renderSubscriptionMailTemplate(
  template: string,
  variables: Record<string, string>,
) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    return variables[key] ?? "";
  });
}

export function splitTemplateParagraphs(value: string) {
  return value
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}
