import { getUpdateAnchorPath } from "@/lib/routes";
import { resolveCanonicalSiteUrl, siteConfig } from "@/lib/site";
import { getParagraphsFromContent } from "@/lib/content";
import { sendMail } from "@/server/mail/send-mail";
import { buildPublishedUpdateNotificationTemplate } from "@/server/mail/templates/published-update-notification";
import {
  markSubscribersLastEmailSent,
  listActiveSubscriberEmails,
  type ActiveSubscriberEmail,
} from "@/server/repositories/subscribers";
import { getSiteSettings } from "@/server/repositories/site";
import {
  markUpdateSubscriptionEmailSent,
  type UpdateItem,
} from "@/server/repositories/updates";

export async function notifySubscribersAboutPublishedUpdate(update: UpdateItem) {
  if (update.subscriptionEmailSentAt) {
    return;
  }

  const siteSettings = await getSiteSettings();
  const siteName = siteSettings?.siteName ?? siteConfig.name;
  const siteUrl = resolveCanonicalSiteUrl(siteSettings);
  const updateUrl = new URL(
    getUpdateAnchorPath({
      updateId: update.id,
    }),
    siteUrl,
  ).toString();
  const updateSummary = summarizeUpdate(update);
  const recipients = await listActiveSubscriberEmails("updates");

  await sendPublishedUpdateNotifications({
    recipients,
    siteName,
    updateTitle: update.title,
    updateSummary,
    updateUrl,
    siteUrl,
  });

  await markUpdateSubscriptionEmailSent(update.id);
  await markSubscribersLastEmailSent(recipients.map((recipient) => recipient.email));
}

async function sendPublishedUpdateNotifications(input: {
  recipients: ActiveSubscriberEmail[];
  siteName: string;
  updateTitle: string;
  updateSummary: string;
  updateUrl: string;
  siteUrl: string;
}) {
  for (const recipient of input.recipients) {
    const unsubscribeUrl = new URL(
      `/unsubscribe?token=${encodeURIComponent(recipient.unsubscribeToken)}`,
      input.siteUrl,
    ).toString();
    const template = buildPublishedUpdateNotificationTemplate({
      siteName: input.siteName,
      updateTitle: input.updateTitle,
      updateSummary: input.updateSummary,
      updateUrl: input.updateUrl,
      unsubscribeUrl,
    });

    await sendMail({
      to: recipient.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}

function summarizeUpdate(update: UpdateItem) {
  const paragraphs = getParagraphsFromContent(update.content).map((item) => item.trim()).filter(Boolean);
  const firstParagraph = paragraphs[0];

  if (!firstParagraph) {
    return "有一条新的动态已经发布，来看看最近的进展。";
  }

  return firstParagraph.length > 180 ? `${firstParagraph.slice(0, 177)}...` : firstParagraph;
}
