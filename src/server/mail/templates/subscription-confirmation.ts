import {
  renderSubscriptionMailTemplate,
  splitTemplateParagraphs,
} from "@/lib/subscription-mail-templates";

type BuildSubscriptionConfirmationTemplateInput = {
  siteName: string;
  avatarUrl?: string | null;
  confirmUrl: string;
  unsubscribeUrl: string;
  subject?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
};

export function buildSubscriptionConfirmationTemplate(
  input: BuildSubscriptionConfirmationTemplateInput,
) {
  const variables = {
    siteName: input.siteName,
    confirmUrl: input.confirmUrl,
    unsubscribeUrl: input.unsubscribeUrl,
  };
  const subject = renderSubscriptionMailTemplate(input.subject ?? `确认订阅 ${input.siteName}`, variables);
  const headline = renderSubscriptionMailTemplate(input.headline ?? "确认你的邮件订阅", variables);
  const body = renderSubscriptionMailTemplate(
    input.body ??
      `你刚刚提交了 ${input.siteName} 的邮件订阅请求。\n\n点一下下面的按钮完成确认。之后如果有新的动态、更新或发布内容，我们会把它安静地送到你的邮箱里。`,
    variables,
  );
  const ctaLabel = renderSubscriptionMailTemplate(input.ctaLabel ?? "确认订阅", variables);
  const bodyParagraphs = splitTemplateParagraphs(body);

  return {
    subject,
    html: `
      <div style="margin: 0; padding: 32px 16px; background: #f5f5f4; color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;">
        <div style="max-width: 640px; margin: 0 auto;">
          <div style="border: 1px solid #e7e5e4; border-radius: 24px; background: #ffffff; overflow: hidden; box-shadow: 0 18px 40px rgba(24, 24, 27, 0.06);">
            <div style="padding: 28px 26px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 18px;">
                <tr>
                  <td style="vertical-align: middle;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        ${
                          input.avatarUrl
                            ? `<td style="padding-right: 10px; vertical-align: middle;">
                                <img
                                  src="${escapeAttribute(input.avatarUrl)}"
                                  alt="${escapeAttribute(input.siteName)}"
                                  width="32"
                                  height="32"
                                  style="display: block; width: 32px; height: 32px; border-radius: 999px; object-fit: cover;"
                                />
                              </td>`
                            : ""
                        }
                        <td style="vertical-align: middle; color: #71717a; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; white-space: nowrap;">
                          ${escapeHtml(input.siteName)}
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; border: 1px solid #e7e5e4; border-radius: 999px; padding: 5px 11px; color: #57534e; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap;">
                      Email Subscription
                    </span>
                  </td>
                </tr>
              </table>

              <h1 style="margin: 0 0 10px; font-size: 24px; line-height: 1.25; font-weight: 600; letter-spacing: -0.03em; color: #111827;">
                ${escapeHtml(headline)}
              </div>

              ${bodyParagraphs
                .map(
                  (paragraph, index) =>
                    `<p style="margin: 0 0 ${index === bodyParagraphs.length - 1 ? "22px" : "10px"}; font-size: 15px; line-height: 1.8; color: #52525b;">${escapeHtml(paragraph)}</p>`,
                )
                .join("")}

              <p style="margin: 0 0 24px; text-align: center;">
                <a
                  href="${escapeAttribute(input.confirmUrl)}"
                  style="display: inline-block; padding: 13px 20px; border-radius: 14px; background: linear-gradient(180deg, #18181b 0%, #09090b 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 0.01em;"
                >
                  ${escapeHtml(ctaLabel)}
                </a>
              </p>

              <div style="padding: 16px 16px 14px; border-radius: 18px; background: #fafaf9; border: 1px solid #f0ece7;">
                <p style="margin: 0 0 8px; font-size: 12px; line-height: 1.7; color: #78716c;">
                  如果按钮无法点击，可以直接打开这个链接：
                </p>
                <p style="margin: 0; word-break: break-all; font-size: 12px; line-height: 1.7;">
                  <a
                    href="${escapeAttribute(input.confirmUrl)}"
                    style="color: #0f172a; text-decoration: underline; text-underline-offset: 2px;"
                  >
                    ${escapeHtml(input.confirmUrl)}
                  </a>
                </p>
              </div>
            </div>

            <div style="border-top: 1px solid #f1f5f9; padding: 18px 26px 20px; background: linear-gradient(180deg, rgba(250,250,249,0.65) 0%, rgba(255,255,255,1) 100%);">
              <p style="margin: 0 0 6px; font-size: 12px; line-height: 1.7; color: #71717a;">
                如果这不是你本人操作，可以忽略这封邮件，不会自动开始订阅。
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 1.7; color: #71717a;">
                如果你已经改变主意，也可以直接退订：
                <a
                  href="${escapeAttribute(input.unsubscribeUrl)}"
                  style="color: #44403c; text-decoration: underline; text-underline-offset: 2px;"
                >
                  ${escapeHtml(input.unsubscribeUrl)}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    `.trim(),
    text:
      `${headline}\n\n` +
      `${body}\n\n` +
      `确认链接：${input.confirmUrl}\n\n` +
      `如果这不是你本人操作，可以忽略这封邮件。\n` +
      `如果你已经改变主意，也可以直接退订：${input.unsubscribeUrl}`,
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

function escapeAttribute(value: string) {
  return escapeHtml(value);
}
