import { UserRole } from "@prisma/client";
import { prisma } from "@/server/db/client";

export type UserListItem = {
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

export type UserAuthMethods = {
  username: string | null;
  hasPasswordLogin: boolean;
  providers: string[];
};

export type UserSecurityProfile = {
  id: string;
  username: string | null;
  email: string | null;
  passwordHash: string | null;
};

export async function listUsersForAdmin(): Promise<UserListItem[]> {
  const users = await prisma.user.findMany({
    orderBy: [{ email: "asc" }, { name: "asc" }],
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

  const roleOrder: Record<UserRole, number> = {
    OWNER: 0,
    ADMIN: 1,
    USER: 2,
  };

  return users.sort((left, right) => {
    const roleDifference = roleOrder[left.role] - roleOrder[right.role];

    if (roleDifference !== 0) {
      return roleDifference;
    }

    const leftLabel = left.email ?? left.name ?? left.username ?? "";
    const rightLabel = right.email ?? right.name ?? right.username ?? "";

    return leftLabel.localeCompare(rightLabel, "zh-Hans-CN");
  });
}

export async function countLocalAdminUsers() {
  return prisma.user.count({
    where: {
      role: {
        in: [UserRole.ADMIN, UserRole.OWNER],
      },
      passwordHash: {
        not: null,
      },
    },
  });
}

export async function createOwnerUser(username: string, passwordHash: string) {
  return prisma.user.create({
    data: {
      username,
      name: username,
      passwordHash,
      role: UserRole.OWNER,
    },
    select: {
      id: true,
    },
  });
}

export async function findLocalUserByUsername(username: string) {
  return prisma.user.findUnique({
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

export async function findPasswordUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      passwordHash: true,
      role: true,
      name: true,
      email: true,
      image: true,
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

export async function deleteUser(userId: string) {
  return prisma.user.delete({
    where: {
      id: userId,
    },
    select: {
      id: true,
    },
  });
}

export async function getUserAuthMethods(userId: string): Promise<UserAuthMethods | null> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      username: true,
      passwordHash: true,
      accounts: {
        select: {
          provider: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    username: user.username,
    hasPasswordLogin: Boolean(user.passwordHash),
    providers: Array.from(new Set(user.accounts.map((account) => account.provider))).sort(),
  };
}

export async function unlinkUserProviderAccount(userId: string, provider: string) {
  return prisma.account.deleteMany({
    where: {
      userId,
      provider,
    },
  });
}

export async function findUserSecurityProfileById(userId: string): Promise<UserSecurityProfile | null> {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      username: true,
      email: true,
      passwordHash: true,
    },
  });
}

export async function updateUserEmail(userId: string, email: string) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      email,
      emailVerified: new Date(),
    },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    },
  });
}

export async function updateUserPasswordHash(userId: string, passwordHash: string) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      passwordHash,
    },
    select: {
      id: true,
    },
  });
}
