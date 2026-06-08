type BuildPublishedPostNotificationTemplateInput = {
  siteName: string;
  postTitle: string;
  postSummary: string | null;
  postUrl: string;
  unsubscribeUrl: string;
};

export function buildPublishedPostNotificationTemplate(
  input: BuildPublishedPostNotificationTemplateInput,
) {
  const summary = input.postSummary?.trim() || "这篇文章刚刚发布，来读第一遍吧。";

  return {
    subject: `[${input.siteName}] ${input.postTitle}`,
    html: `
      <div style="margin: 0; padding: 32px 16px; background: #f5f5f4; color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;">
        <div style="max-width: 640px; margin: 0 auto;">
          <div style="margin-bottom: 18px; color: #71717a; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase;">
            ${escapeHtml(input.siteName)}
          </div>

          <div style="border: 1px solid #e7e5e4; border-radius: 24px; background: #ffffff; overflow: hidden; box-shadow: 0 18px 40px rgba(24, 24, 27, 0.06);">
            <div style="padding: 36px 32px 32px;">
              <div style="display: inline-flex; align-items: center; border: 1px solid #e7e5e4; border-radius: 999px; padding: 6px 12px; color: #57534e; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">
                New Post
              </div>

              <h1 style="margin: 18px 0 12px; font-size: 30px; line-height: 1.2; font-weight: 600; letter-spacing: -0.03em; color: #111827;">
                ${escapeHtml(input.postTitle)}
              </h1>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.85; color: #3f3f46;">
                ${escapeHtml(summary)}
              </p>

              <p style="margin: 0 0 28px;">
                <a
                  href="${escapeAttribute(input.postUrl)}"
                  style="display: inline-block; padding: 14px 22px; border-radius: 999px; background: linear-gradient(180deg, #18181b 0%, #09090b 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; letter-spacing: 0.01em;"
                >
                  阅读这篇文章
                </a>
              </p>

              <div style="padding: 18px 18px 16px; border-radius: 18px; background: #fafaf9; border: 1px solid #f0ece7;">
                <p style="margin: 0 0 10px; font-size: 13px; line-height: 1.75; color: #78716c;">
                  如果按钮无法点击，可以直接打开这个链接：
                </p>
                <p style="margin: 0; word-break: break-all;">
                  <a
                    href="${escapeAttribute(input.postUrl)}"
                    style="color: #0f172a; text-decoration: underline; text-underline-offset: 2px;"
                  >
                    ${escapeHtml(input.postUrl)}
                  </a>
                </p>
              </div>
            </div>

            <div style="border-top: 1px solid #f1f5f9; padding: 20px 32px 24px; background: linear-gradient(180deg, rgba(250,250,249,0.65) 0%, rgba(255,255,255,1) 100%);">
              <p style="margin: 0; font-size: 13px; line-height: 1.8; color: #71717a;">
                如果你不想继续接收文章通知，可以随时退订：
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
      `${input.postTitle}\n\n` +
      `${summary}\n\n` +
      `阅读文章：${input.postUrl}\n\n` +
      `不想继续接收文章通知？退订：${input.unsubscribeUrl}`,
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
