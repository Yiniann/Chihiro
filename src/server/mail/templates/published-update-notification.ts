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
            <div style="padding: 36px 32px 32px;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px;">
                <div style="display: inline-flex; align-items: center; gap: 12px; min-width: 0;">
                  ${
                    input.avatarUrl
                      ? `<img
                          src="${escapeAttribute(input.avatarUrl)}"
                          alt="${escapeAttribute(input.siteName)}"
                          width="40"
                          height="40"
                          style="display: block; width: 40px; height: 40px; border-radius: 999px; object-fit: cover;"
                        />`
                      : ""
                  }
                  <div style="color: #71717a; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase;">
                    ${escapeHtml(input.siteName)}
                  </div>
                </div>

                <div style="display: inline-flex; align-items: center; border: 1px solid #e7e5e4; border-radius: 999px; padding: 6px 12px; color: #57534e; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap;">
                  New Update
                </div>
              </div>

              <h1 style="margin: 18px 0 12px; font-size: 30px; line-height: 1.2; font-weight: 600; letter-spacing: -0.03em; color: #111827;">
                ${escapeHtml(headline)}
              </h1>

              ${bodyParagraphs
                .map(
                  (paragraph, index) =>
                    `<p style="margin: 0 0 ${index === bodyParagraphs.length - 1 ? "24px" : "12px"}; font-size: 16px; line-height: 1.85; color: #3f3f46;">${escapeHtml(paragraph)}</p>`,
                )
                .join("")}

              <p style="margin: 0 0 28px;">
                <a
                  href="${escapeAttribute(input.updateUrl)}"
                  style="display: inline-block; padding: 14px 22px; border-radius: 999px; background: linear-gradient(180deg, #18181b 0%, #09090b 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; letter-spacing: 0.01em;"
                >
                  ${escapeHtml(ctaLabel)}
                </a>
              </p>

              <div style="padding: 18px 18px 16px; border-radius: 18px; background: #fafaf9; border: 1px solid #f0ece7;">
                <p style="margin: 0 0 10px; font-size: 13px; line-height: 1.75; color: #78716c;">
                  如果按钮无法点击，可以直接打开这个链接：
                </p>
                <p style="margin: 0; word-break: break-all;">
                  <a
                    href="${escapeAttribute(input.updateUrl)}"
                    style="color: #0f172a; text-decoration: underline; text-underline-offset: 2px;"
                  >
                    ${escapeHtml(input.updateUrl)}
                  </a>
                </p>
              </div>
            </div>

            <div style="border-top: 1px solid #f1f5f9; padding: 20px 32px 24px; background: linear-gradient(180deg, rgba(250,250,249,0.65) 0%, rgba(255,255,255,1) 100%);">
              <p style="margin: 0; font-size: 13px; line-height: 1.8; color: #71717a;">
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
