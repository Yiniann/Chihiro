import { MailJobContentType, MailJobKind } from "@prisma/client";
import { getUpdateAnchorPath } from "@/lib/routes";
import { resolveAbsoluteAssetUrl, resolveCanonicalSiteUrl, siteConfig } from "@/lib/site";
import { getParagraphsFromContent } from "@/lib/content";
import { buildPublishedUpdateNotificationTemplate } from "@/server/mail/templates/published-update-notification";
import {
  listActiveSubscriberEmails,
  type ActiveSubscriberEmail,
} from "@/server/repositories/subscribers";
import {
  enqueueMailJobs,
  type EnqueueMailJobInput,
} from "@/server/repositories/mail-jobs";
import { getPublicInteractionSettings } from "@/server/repositories/public-interactions";
import { getSiteSettings } from "@/server/repositories/site";
import {
  markUpdateSubscriptionEmailSent,
  type UpdateItem,
} from "@/server/repositories/updates";

export async function notifySubscribersAboutPublishedUpdate(update: UpdateItem) {
  if (update.subscriptionEmailSentAt) {
    return;
  }

  const [siteSettings, interactionSettings] = await Promise.all([
    getSiteSettings(),
    getPublicInteractionSettings(),
  ]);
  const siteName = siteSettings?.siteName ?? siteConfig.name;
  const siteUrl = resolveCanonicalSiteUrl(siteSettings);
  const avatarUrl = resolveAbsoluteAssetUrl(siteSettings?.authorAvatarUrl, siteSettings);
  const updateUrl = new URL(
    getUpdateAnchorPath({
      updateId: update.id,
    }),
    siteUrl,
  ).toString();
  const updateSummary = summarizeUpdate(update);
  const recipients = await listActiveSubscriberEmails("updates");

  if (recipients.length === 0) {
    await markUpdateSubscriptionEmailSent(update.id);
    return;
  }

  await enqueuePublishedUpdateNotifications({
    recipients,
    updateId: update.id,
    siteName,
    avatarUrl,
    updateTitle: update.title,
    updateSummary,
    updateUrl,
    siteUrl,
    subject: interactionSettings.updateNotificationSubject,
    headline: interactionSettings.updateNotificationHeadline,
    body: interactionSettings.updateNotificationBody,
    ctaLabel: interactionSettings.updateNotificationCtaLabel,
  });
}

async function enqueuePublishedUpdateNotifications(input: {
  recipients: ActiveSubscriberEmail[];
  updateId: number;
  siteName: string;
  avatarUrl: string | null | undefined;
  updateTitle: string;
  updateSummary: string;
  updateUrl: string;
  siteUrl: string;
  subject: string;
  headline: string;
  body: string;
  ctaLabel: string;
}) {
  const jobs: EnqueueMailJobInput[] = [];

  for (const recipient of input.recipients) {
    const unsubscribeUrl = new URL(
      `/unsubscribe?token=${encodeURIComponent(recipient.unsubscribeToken)}`,
      input.siteUrl,
    ).toString();
    const template = buildPublishedUpdateNotificationTemplate({
      siteName: input.siteName,
      avatarUrl: input.avatarUrl,
      updateTitle: input.updateTitle,
      updateSummary: input.updateSummary,
      updateUrl: input.updateUrl,
      unsubscribeUrl,
      subject: input.subject,
      headline: input.headline,
      body: input.body,
      ctaLabel: input.ctaLabel,
    });

    jobs.push({
      kind: MailJobKind.UPDATE_PUBLISHED,
      contentType: MailJobContentType.UPDATE,
      contentId: input.updateId,
      recipientEmail: recipient.email,
      dedupeKey: `update-published:${input.updateId}:${recipient.email.toLowerCase()}`,
      payload: {
        to: recipient.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      },
    });
  }

  await enqueueMailJobs(jobs);
}

function summarizeUpdate(update: UpdateItem) {
  const paragraphs = getParagraphsFromContent(update.content).map((item) => item.trim()).filter(Boolean);
  const firstParagraph = paragraphs[0];

  if (!firstParagraph) {
    return "有一条新的动态已经发布，来看看最近的进展。";
  }

  return firstParagraph.length > 180 ? `${firstParagraph.slice(0, 177)}...` : firstParagraph;
}
