import {
  renderSubscriptionMailTemplate,
  splitTemplateParagraphs,
} from "@/lib/subscription-mail-templates";

type BuildPublishedUpdateNotificationTemplateInput = {
  siteName: string;
  avatarUrl?: string | null;
  updateTitle: string;
  updateSummary: string;
  updateUrl: string;
  unsubscribeUrl: string;
  subject?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
};

export function buildPublishedUpdateNotificationTemplate(
  input: BuildPublishedUpdateNotificationTemplateInput,
) {
  const variables = {
    siteName: input.siteName,
    title: input.updateTitle,
    summary: input.updateSummary,
    url: input.updateUrl,
    unsubscribeUrl: input.unsubscribeUrl,
  };
  const subject = renderSubscriptionMailTemplate(
    input.subject ?? `[${input.siteName}] ${input.updateTitle}`,
    variables,
  );
  const headline = renderSubscriptionMailTemplate(input.headline ?? input.updateTitle, variables);
  const body = renderSubscriptionMailTemplate(input.body ?? input.updateSummary, variables);
  const ctaLabel = renderSubscriptionMailTemplate(input.ctaLabel ?? "查看这条动态", variables);
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
                      New Update
                    </span>
                  </td>
                </tr>
              </table>

              <h1 style="margin: 0 0 10px; font-size: 24px; line-height: 1.25; font-weight: 600; letter-spacing: -0.03em; color: #111827;">
                ${escapeHtml(headline)}
              </h1>

              ${bodyParagraphs
                .map(
                  (paragraph, index) =>
                    `<p style="margin: 0 0 ${index === bodyParagraphs.length - 1 ? "22px" : "10px"}; font-size: 15px; line-height: 1.8; color: #52525b;">${escapeHtml(paragraph)}</p>`,
                )
                .join("")}

              <p style="margin: 0 0 24px; text-align: center;">
                <a
                  href="${escapeAttribute(input.updateUrl)}"
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
                    href="${escapeAttribute(input.updateUrl)}"
                    style="color: #0f172a; text-decoration: underline; text-underline-offset: 2px;"
                  >
                    ${escapeHtml(input.updateUrl)}
                  </a>
                </p>
              </div>
            </div>

            <div style="border-top: 1px solid #f1f5f9; padding: 18px 26px 20px; background: linear-gradient(180deg, rgba(250,250,249,0.65) 0%, rgba(255,255,255,1) 100%);">
              <p style="margin: 0; font-size: 12px; line-height: 1.7; color: #71717a;">
                如果你不想继续接收动态通知，可以随时退订：
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
      `查看动态：${input.updateUrl}\n\n` +
      `不想继续接收动态通知？退订：${input.unsubscribeUrl}`,
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
