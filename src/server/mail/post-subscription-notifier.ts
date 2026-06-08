import { MailJobContentType, MailJobKind } from "@prisma/client";
import { getPostPath } from "@/lib/routes";
import { resolveAbsoluteAssetUrl, resolveCanonicalSiteUrl, siteConfig } from "@/lib/site";
import { buildPublishedPostNotificationTemplate } from "@/server/mail/templates/published-post-notification";
import { type PostItem, markPostSubscriptionEmailSent } from "@/server/repositories/posts";
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

export async function notifySubscribersAboutPublishedPost(post: PostItem) {
  if (post.subscriptionEmailSentAt) {
    return;
  }

  const [siteSettings, interactionSettings] = await Promise.all([
    getSiteSettings(),
    getPublicInteractionSettings(),
  ]);
  const siteName = siteSettings?.siteName ?? siteConfig.name;
  const siteUrl = resolveCanonicalSiteUrl(siteSettings);
  const avatarUrl = resolveAbsoluteAssetUrl(siteSettings?.authorAvatarUrl, siteSettings);
  const postUrl = new URL(
    getPostPath({
      slug: post.slug,
      categorySlug: post.category?.slug,
    }),
    siteUrl,
  ).toString();
  const recipients = await listActiveSubscriberEmails("posts");

  if (recipients.length === 0) {
    await markPostSubscriptionEmailSent(post.id);
    return;
  }

  await enqueuePublishedPostNotifications({
    recipients,
    postId: post.id,
    siteName,
    avatarUrl,
    postTitle: post.title,
    postSummary: post.summary,
    postUrl,
    siteUrl,
    subject: interactionSettings.postNotificationSubject,
    headline: interactionSettings.postNotificationHeadline,
    body: interactionSettings.postNotificationBody,
    ctaLabel: interactionSettings.postNotificationCtaLabel,
  });
}

async function enqueuePublishedPostNotifications(input: {
  recipients: ActiveSubscriberEmail[];
  postId: number;
  siteName: string;
  avatarUrl: string | null | undefined;
  postTitle: string;
  postSummary: string | null;
  postUrl: string;
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
    const template = buildPublishedPostNotificationTemplate({
      siteName: input.siteName,
      avatarUrl: input.avatarUrl,
      postTitle: input.postTitle,
      postSummary: input.postSummary,
      postUrl: input.postUrl,
      unsubscribeUrl,
      subject: input.subject,
      headline: input.headline,
      body: input.body,
      ctaLabel: input.ctaLabel,
    });

    jobs.push({
      kind: MailJobKind.POST_PUBLISHED,
      contentType: MailJobContentType.POST,
      contentId: input.postId,
      recipientEmail: recipient.email,
      dedupeKey: `post-published:${input.postId}:${recipient.email.toLowerCase()}`,
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
