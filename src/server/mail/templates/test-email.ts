type BuildTestEmailTemplateInput = {
  siteName: string;
};

export function buildTestEmailTemplate(input: BuildTestEmailTemplateInput) {
  return {
    subject: `${input.siteName} SMTP 测试邮件`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #18181b;">
        <h1 style="font-size: 20px; margin-bottom: 12px;">SMTP 已连接成功</h1>
        <p style="margin: 0 0 12px;">这是一封来自 ${escapeHtml(input.siteName)} 的测试邮件。</p>
        <p style="margin: 0;">如果你收到了这封邮件，说明当前 SMTP 发信配置已经可以工作。</p>
      </div>
    `.trim(),
    text: `SMTP 已连接成功\n\n这是一封来自 ${input.siteName} 的测试邮件。\n如果你收到了这封邮件，说明当前 SMTP 发信配置已经可以工作。`,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
