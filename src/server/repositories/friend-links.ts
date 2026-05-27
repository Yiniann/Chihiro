import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";

type FriendLinkRecord = NonNullable<
  Awaited<ReturnType<typeof prisma.friendLink.findUnique>>
>;

export type FriendLinkItem = {
  id: number;
  name: string;
  url: string;
  description: string | null;
  avatarUrl: string | null;
  location: string | null;
  feedUrl: string | null;
  email: string | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SaveFriendLinkInput = {
  id?: number;
  name: string;
  url: string;
  description: string | null;
  avatarUrl: string | null;
  location: string | null;
  feedUrl: string | null;
  email: string | null;
  sortOrder: number;
  isVisible: boolean;
};

export async function listFriendLinksForAdmin(): Promise<FriendLinkItem[]> {
  const items = await prisma.friendLink.findMany({
    orderBy: [
      { sortOrder: Prisma.SortOrder.asc },
      { updatedAt: Prisma.SortOrder.desc },
      { name: Prisma.SortOrder.asc },
    ],
  });

  return items.map(mapFriendLinkRecord);
}

export async function listPublicFriendLinks(): Promise<FriendLinkItem[]> {
  const items = await prisma.friendLink.findMany({
    where: {
      isVisible: true,
    },
    orderBy: [
      { sortOrder: Prisma.SortOrder.asc },
      { updatedAt: Prisma.SortOrder.desc },
      { name: Prisma.SortOrder.asc },
    ],
  });

  return items.map(mapFriendLinkRecord);
}

export async function createFriendLink(input: SaveFriendLinkInput): Promise<FriendLinkItem> {
  const item = await prisma.friendLink.create({
    data: {
      name: input.name,
      url: input.url,
      description: input.description,
      avatarUrl: input.avatarUrl,
      location: input.location,
      feedUrl: input.feedUrl,
      email: input.email,
      sortOrder: input.sortOrder,
      isVisible: input.isVisible,
    },
  });

  return mapFriendLinkRecord(item);
}

export async function updateFriendLink(input: SaveFriendLinkInput & { id: number }): Promise<FriendLinkItem> {
  const item = await prisma.friendLink.update({
    where: {
      id: input.id,
    },
    data: {
      name: input.name,
      url: input.url,
      description: input.description,
      avatarUrl: input.avatarUrl,
      location: input.location,
      feedUrl: input.feedUrl,
      email: input.email,
      sortOrder: input.sortOrder,
      isVisible: input.isVisible,
    },
  });

  return mapFriendLinkRecord(item);
}

export async function deleteFriendLinkById(id: number): Promise<FriendLinkItem> {
  const item = await prisma.friendLink.delete({
    where: {
      id,
    },
  });

  return mapFriendLinkRecord(item);
}

function mapFriendLinkRecord(record: FriendLinkRecord): FriendLinkItem {
  return {
    id: record.id,
    name: record.name,
    url: record.url,
    description: record.description,
    avatarUrl: record.avatarUrl,
    location: record.location,
    feedUrl: record.feedUrl,
    email: record.email,
    sortOrder: record.sortOrder,
    isVisible: record.isVisible,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
