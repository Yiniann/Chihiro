import { prisma } from "@/server/db/client";

export async function getSiteLikeState(visitorId: string) {
  const [likeCount, like] = await Promise.all([
    prisma.siteLike.count(),
    prisma.siteLike.findUnique({
      where: { visitorId },
      select: { id: true },
    }),
  ]);

  return {
    likeCount,
    liked: Boolean(like),
  };
}

export async function getSiteLikeCount() {
  return prisma.siteLike.count();
}

export async function likeSite(visitorId: string) {
  const existingLike = await prisma.siteLike.findUnique({
    where: { visitorId },
    select: { id: true },
  });

  if (!existingLike) {
    await prisma.siteLike.create({
      data: { visitorId },
    });
  }

  return getSiteLikeState(visitorId);
}
