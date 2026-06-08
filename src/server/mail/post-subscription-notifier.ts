import { getPostPath } from "@/lib/routes";
import { resolveCanonicalSiteUrl, siteConfig } from "@/lib/site";
import { sendMail } from "@/server/mail/send-mail";
import { buildPublishedPostNotificationTemplate } from "@/server/mail/templates/published-post-notification";
import { type PostItem, markPostSubscriptionEmailSent } from "@/server/repositories/posts";
import {
  listActiveSubscriberEmails,
  type ActiveSubscriberEmail,
  markSubscribersLastEmailSent,
} from "@/server/repositories/subscribers";
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
  const postUrl = new URL(
    getPostPath({
      slug: post.slug,
      categorySlug: post.category?.slug,
    }),
    siteUrl,
  ).toString();
  const recipients = await listActiveSubscriberEmails("posts");

  await sendPublishedPostNotifications({
    recipients,
    siteName,
    avatarUrl: siteSettings?.authorAvatarUrl,
    postTitle: post.title,
    postSummary: post.summary,
    postUrl,
    siteUrl,
    subject: interactionSettings.postNotificationSubject,
    headline: interactionSettings.postNotificationHeadline,
    body: interactionSettings.postNotificationBody,
    ctaLabel: interactionSettings.postNotificationCtaLabel,
  });

  await markPostSubscriptionEmailSent(post.id);
  await markSubscribersLastEmailSent(recipients.map((recipient) => recipient.email));
}

async function sendPublishedPostNotifications(input: {
  recipients: ActiveSubscriberEmail[];
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

    await sendMail({
      to: recipient.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}
