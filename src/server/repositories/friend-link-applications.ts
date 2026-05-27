import { FriendLinkApplicationStatus, Prisma, type FriendLink } from "@prisma/client";
import { prisma } from "@/server/db/client";

type FriendLinkApplicationRecord = NonNullable<
  Awaited<ReturnType<typeof prisma.friendLinkApplication.findUnique>>
>;

export type FriendLinkApplicationItem = {
  id: number;
  nickname: string | null;
  siteName: string;
  siteUrl: string;
  description: string | null;
  avatarUrl: string | null;
  rssUrl: string | null;
  contactEmail: string;
  message: string | null;
  status: FriendLinkApplicationStatus;
  reviewedAt: string | null;
  friendLinkId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateFriendLinkApplicationInput = {
  nickname: string;
  siteName: string;
  siteUrl: string;
  description: string | null;
  avatarUrl: string | null;
  rssUrl: string | null;
  contactEmail: string;
  message: string | null;
};

export type FriendLinkApplicationStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

export type CreateApprovedFriendLinkApplicationInput = {
  nickname: string | null;
  siteName: string;
  siteUrl: string;
  description: string | null;
  avatarUrl: string | null;
  contactEmail: string | null;
  message: string | null;
  sortOrder: number;
  isVisible: boolean;
};

export async function createFriendLinkApplication(
  input: CreateFriendLinkApplicationInput,
): Promise<FriendLinkApplicationItem> {
  const item = await prisma.friendLinkApplication.create({
    data: input,
  });

  return mapFriendLinkApplicationRecord(item);
}

export async function createApprovedFriendLinkApplication(
  input: CreateApprovedFriendLinkApplicationInput,
): Promise<FriendLinkApplicationItem> {
  const item = await prisma.$transaction(async (tx) => {
    const friendLink = await tx.friendLink.create({
      data: {
        name: input.siteName,
        url: input.siteUrl,
        description: input.description,
        avatarUrl: input.avatarUrl,
        location: null,
        feedUrl: null,
        email: input.contactEmail,
        sortOrder: input.sortOrder,
        isVisible: input.isVisible,
      },
    });

    return tx.friendLinkApplication.create({
      data: {
        nickname: input.nickname,
        siteName: input.siteName,
        siteUrl: input.siteUrl,
        description: input.description,
        avatarUrl: input.avatarUrl,
        rssUrl: null,
        contactEmail: input.contactEmail ?? "",
        message: input.message,
        status: FriendLinkApplicationStatus.APPROVED,
        reviewedAt: new Date(),
        friendLinkId: friendLink.id,
      },
    });
  });

  return mapFriendLinkApplicationRecord(item);
}

export async function listFriendLinkApplicationsForAdmin(
  status?: FriendLinkApplicationStatus,
): Promise<FriendLinkApplicationItem[]> {
  const items = await prisma.friendLinkApplication.findMany({
    where:
      status === FriendLinkApplicationStatus.APPROVED
        ? {
            status,
            friendLinkId: {
              not: null,
            },
          }
        : status
          ? { status }
          : undefined,
    orderBy:
      status === FriendLinkApplicationStatus.PENDING
        ? [{ createdAt: Prisma.SortOrder.asc }]
        : [{ updatedAt: Prisma.SortOrder.desc }, { createdAt: Prisma.SortOrder.desc }],
  });

  return items.map(mapFriendLinkApplicationRecord);
}

export async function getFriendLinkApplicationStats(): Promise<FriendLinkApplicationStats> {
  const [total, pending, approved, rejected] = await Promise.all([
    prisma.friendLinkApplication.count(),
    prisma.friendLinkApplication.count({ where: { status: FriendLinkApplicationStatus.PENDING } }),
    prisma.friendLinkApplication.count({
      where: {
        status: FriendLinkApplicationStatus.APPROVED,
        friendLinkId: {
          not: null,
        },
      },
    }),
    prisma.friendLinkApplication.count({ where: { status: FriendLinkApplicationStatus.REJECTED } }),
  ]);

  return {
    total,
    pending,
    approved,
    rejected,
  };
}

export async function approveFriendLinkApplication(id: number): Promise<FriendLinkApplicationItem> {
  const item = await prisma.$transaction(async (tx) => {
    const application = await tx.friendLinkApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new Error("友链申请不存在。");
    }

    let friendLinkId = application.friendLinkId;

    if (!friendLinkId) {
      const friendLink = await tx.friendLink.create({
        data: buildFriendLinkDataFromApplication(application),
      });
      friendLinkId = friendLink.id;
    } else {
      await tx.friendLink.update({
        where: { id: friendLinkId },
        data: buildFriendLinkDataFromApplication(application),
      });
    }

    return tx.friendLinkApplication.update({
      where: { id },
      data: {
        status: FriendLinkApplicationStatus.APPROVED,
        reviewedAt: new Date(),
        friendLinkId,
      },
    });
  });

  return mapFriendLinkApplicationRecord(item);
}

export async function rejectFriendLinkApplication(id: number): Promise<FriendLinkApplicationItem> {
  const item = await prisma.$transaction(async (tx) => {
    const application = await tx.friendLinkApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new Error("友链申请不存在。");
    }

    if (application.friendLinkId) {
      await tx.friendLink.delete({
        where: { id: application.friendLinkId },
      });
    }

    return tx.friendLinkApplication.update({
      where: { id },
      data: {
        status: FriendLinkApplicationStatus.REJECTED,
        reviewedAt: new Date(),
        friendLinkId: null,
      },
    });
  });

  return mapFriendLinkApplicationRecord(item);
}

export async function holdFriendLinkApplication(id: number): Promise<FriendLinkApplicationItem> {
  const item = await prisma.$transaction(async (tx) => {
    const application = await tx.friendLinkApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new Error("友链申请不存在。");
    }

    if (application.friendLinkId) {
      await tx.friendLink.delete({
        where: { id: application.friendLinkId },
      });
    }

    return tx.friendLinkApplication.update({
      where: { id },
      data: {
        status: FriendLinkApplicationStatus.PENDING,
        reviewedAt: null,
        friendLinkId: null,
      },
    });
  });

  return mapFriendLinkApplicationRecord(item);
}

function buildFriendLinkDataFromApplication(application: {
  siteName: string;
  siteUrl: string;
  description: string | null;
  avatarUrl: string | null;
  contactEmail: string;
}): Omit<FriendLink, "id" | "createdAt" | "updatedAt"> {
  return {
    name: application.siteName,
    url: application.siteUrl,
    description: application.description,
    avatarUrl: application.avatarUrl,
    location: null,
    feedUrl: null,
    email: application.contactEmail,
    sortOrder: 0,
    isVisible: true,
  };
}

function mapFriendLinkApplicationRecord(record: FriendLinkApplicationRecord): FriendLinkApplicationItem {
  return {
    id: record.id,
    nickname: record.nickname,
    siteName: record.siteName,
    siteUrl: record.siteUrl,
    description: record.description,
    avatarUrl: record.avatarUrl,
    rssUrl: record.rssUrl,
    contactEmail: record.contactEmail,
    message: record.message,
    status: record.status,
    reviewedAt: record.reviewedAt?.toISOString() ?? null,
    friendLinkId: record.friendLinkId,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
