import { SubscriberStatus } from "@prisma/client";
import { prisma } from "@/server/db/client";

export type SubscriberListItem = {
  id: string;
  email: string;
  status: SubscriberStatus;
  subscribedToPosts: boolean;
  subscribedToUpdates: boolean;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  lastEmailSentAt: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ActiveSubscriberEmail = {
  email: string;
  unsubscribeToken: string;
  subscribedToPosts: boolean;
  subscribedToUpdates: boolean;
};

export type SubscriberStats = {
  total: number;
  active: number;
  pending: number;
  unsubscribed: number;
};

export async function upsertPendingSubscriber(input: {
  email: string;
  confirmToken: string;
  unsubscribeToken: string;
  subscribedToPosts: boolean;
  subscribedToUpdates: boolean;
  source?: string | null;
}) {
  const existing = await prisma.subscriber.findUnique({
    where: {
      email: input.email,
    },
  });

  if (!existing) {
    return prisma.subscriber.create({
      data: {
        email: input.email,
        status: SubscriberStatus.PENDING,
        confirmToken: input.confirmToken,
        unsubscribeToken: input.unsubscribeToken,
        subscribedToPosts: input.subscribedToPosts,
        subscribedToUpdates: input.subscribedToUpdates,
        source: input.source ?? null,
      },
    });
  }

  if (existing.status === SubscriberStatus.ACTIVE) {
    return prisma.subscriber.update({
      where: {
        id: existing.id,
      },
      data: {
        subscribedToPosts: input.subscribedToPosts,
        subscribedToUpdates: input.subscribedToUpdates,
        source: input.source ?? existing.source,
      },
    });
  }

  return prisma.subscriber.update({
    where: {
      id: existing.id,
    },
    data: {
      status: SubscriberStatus.PENDING,
      confirmToken: input.confirmToken,
      unsubscribeToken: existing.unsubscribeToken || input.unsubscribeToken,
      subscribedToPosts: input.subscribedToPosts,
      subscribedToUpdates: input.subscribedToUpdates,
      unsubscribedAt: null,
      source: input.source ?? existing.source,
    },
  });
}

export async function findSubscriberByEmail(email: string) {
  return prisma.subscriber.findUnique({
    where: {
      email,
    },
  });
}

export async function confirmSubscriberByToken(token: string) {
  const subscriber = await prisma.subscriber.findUnique({
    where: {
      confirmToken: token,
    },
  });

  if (!subscriber) {
    return null;
  }

  if (subscriber.status === SubscriberStatus.ACTIVE) {
    return subscriber;
  }

  return prisma.subscriber.update({
    where: {
      id: subscriber.id,
    },
    data: {
      status: SubscriberStatus.ACTIVE,
      confirmedAt: subscriber.confirmedAt ?? new Date(),
      unsubscribedAt: null,
    },
  });
}

export async function unsubscribeSubscriberByToken(token: string) {
  const subscriber = await prisma.subscriber.findUnique({
    where: {
      unsubscribeToken: token,
    },
  });

  if (!subscriber) {
    return null;
  }

  if (subscriber.status === SubscriberStatus.UNSUBSCRIBED) {
    return subscriber;
  }

  return prisma.subscriber.update({
    where: {
      id: subscriber.id,
    },
    data: {
      status: SubscriberStatus.UNSUBSCRIBED,
      unsubscribedAt: new Date(),
    },
  });
}

export async function listSubscribersForAdmin(): Promise<SubscriberListItem[]> {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return subscribers.map((subscriber) => ({
    id: subscriber.id,
    email: subscriber.email,
    status: subscriber.status,
    subscribedToPosts: subscriber.subscribedToPosts,
    subscribedToUpdates: subscriber.subscribedToUpdates,
    confirmedAt: subscriber.confirmedAt?.toISOString() ?? null,
    unsubscribedAt: subscriber.unsubscribedAt?.toISOString() ?? null,
    lastEmailSentAt: subscriber.lastEmailSentAt?.toISOString() ?? null,
    source: subscriber.source,
    createdAt: subscriber.createdAt.toISOString(),
    updatedAt: subscriber.updatedAt.toISOString(),
  }));
}

export async function getSubscriberStats(): Promise<SubscriberStats> {
  const [total, active, pending, unsubscribed] = await Promise.all([
    prisma.subscriber.count(),
    prisma.subscriber.count({ where: { status: SubscriberStatus.ACTIVE } }),
    prisma.subscriber.count({ where: { status: SubscriberStatus.PENDING } }),
    prisma.subscriber.count({ where: { status: SubscriberStatus.UNSUBSCRIBED } }),
  ]);

  return {
    total,
    active,
    pending,
    unsubscribed,
  };
}

export async function setSubscriberStatusById(id: string, status: SubscriberStatus) {
  return prisma.subscriber.update({
    where: {
      id,
    },
    data: {
      status,
      confirmedAt: status === SubscriberStatus.ACTIVE ? new Date() : undefined,
      unsubscribedAt: status === SubscriberStatus.UNSUBSCRIBED ? new Date() : null,
    },
  });
}

export async function listActiveSubscriberEmails(kind?: "posts" | "updates"): Promise<
  ActiveSubscriberEmail[]
> {
  return prisma.subscriber.findMany({
    where: {
      status: SubscriberStatus.ACTIVE,
      ...(kind === "posts"
        ? { subscribedToPosts: true }
        : kind === "updates"
          ? { subscribedToUpdates: true }
          : {}),
    },
    select: {
      email: true,
      unsubscribeToken: true,
      subscribedToPosts: true,
      subscribedToUpdates: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function markSubscribersLastEmailSent(emails: string[], sentAt = new Date()) {
  const uniqueEmails = Array.from(new Set(emails.filter(Boolean)));

  if (uniqueEmails.length === 0) {
    return { count: 0 };
  }

  return prisma.subscriber.updateMany({
    where: {
      email: {
        in: uniqueEmails,
      },
    },
    data: {
      lastEmailSentAt: sentAt,
    },
  });
}
