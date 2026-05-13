import { UserRole } from "@prisma/client";
import { prisma } from "@/server/db/client";

export async function countAdminUsers() {
  return prisma.adminUser.count();
}

export async function findAdminUserByUsername(username: string) {
  return prisma.adminUser.findUnique({
    where: { username },
  });
}

export async function createAdminUser(username: string, passwordHash: string) {
  return prisma.$transaction(async (tx) => {
    const adminUser = await tx.adminUser.create({
      data: {
        username,
        passwordHash,
      },
    });

    await tx.user.upsert({
      where: {
        id: adminUser.id,
      },
      create: {
        id: adminUser.id,
        username,
        name: username,
        passwordHash,
        role: UserRole.OWNER,
      },
      update: {
        username,
        passwordHash,
        role: UserRole.OWNER,
      },
    });

    return adminUser;
  });
}

export async function createAdminSessionRecord(userId: string, token: string, expiresAt: Date) {
  return prisma.adminSession.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
}

export async function findActiveAdminSessionByToken(token: string) {
  return prisma.adminSession.findFirst({
    where: {
      token,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: true,
    },
  });
}

export async function deleteAdminSessionByToken(token: string) {
  await prisma.adminSession.deleteMany({
    where: { token },
  });
}
