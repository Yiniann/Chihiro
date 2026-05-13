import { UserRole } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { syncAdminUsersToPublicUsers } from "@/server/repositories/admin-auth";

export type AdminUserListItem = {
  id: string;
  username: string | null;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
  accounts: Array<{
    provider: string;
    providerAccountId: string;
  }>;
};

export async function listUsersForAdmin(): Promise<AdminUserListItem[]> {
  await syncAdminUsersToPublicUsers();

  return prisma.user.findMany({
    orderBy: [{ role: "desc" }, { email: "asc" }, { name: "asc" }],
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      image: true,
      role: true,
      accounts: {
        select: {
          provider: true,
          providerAccountId: true,
        },
      },
    },
  });
}

export async function findLocalUserByUsername(username: string) {
  return prisma.user.findFirst({
    where: {
      username,
    },
    select: {
      id: true,
      passwordHash: true,
      role: true,
    },
  });
}

export async function createPublicSessionRecord(userId: string, sessionToken: string, expires: Date) {
  return prisma.session.create({
    data: {
      userId,
      sessionToken,
      expires,
    },
  });
}

export async function findUserRole(userId: string) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      role: true,
    },
  });
}

export async function updateUserRole(userId: string, role: UserRole) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role,
    },
    select: {
      id: true,
      role: true,
    },
  });
}
