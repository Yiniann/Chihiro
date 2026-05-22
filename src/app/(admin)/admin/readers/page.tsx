import { UserRole } from "@prisma/client";
import Link from "next/link";
import { LiveSearchInput } from "@/app/(admin)/admin/live-search-input";
import { EmptyPanel } from "@/app/(admin)/admin/ui";
import { deleteUserAction, setUserRoleAction } from "@/app/(admin)/admin/settings/users/actions";
import { isOwnerAuthenticated } from "@/server/auth";
import { listUsersForAdmin, type UserListItem } from "@/server/repositories/users";

type AdminReadersSearchParams = Promise<{
  q?: string;
}>;

export default async function AdminReadersPage({
  searchParams,
}: {
  searchParams: AdminReadersSearchParams;
}) {
  const { q } = await searchParams;
  const [users, canManageReaders] = await Promise.all([
    listUsersForAdmin(),
    isOwnerAuthenticated(),
  ]);
  const query = (q ?? "").trim();
  const managedUsers = users
    .filter((user) => user.role !== UserRole.OWNER)
    .filter((user) => matchesReaderQuery(user, query));

  return (
    <div className="grid gap-8">
      {!canManageReaders ? (
        <p className="max-w-2xl text-sm leading-7 text-zinc-400 dark:text-zinc-500">
          当前帐号不是 Owner，以下按钮仅展示为禁用态。
        </p>
      ) : null}

      <section className="grid gap-3 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <LiveSearchInput
              defaultValue={query}
              placeholder="搜索姓名、邮箱、用户名或登录方式"
            />
          </div>

          <div className="flex items-center gap-3 lg:self-end">
            {query ? (
              <Link
                href="/admin/readers"
                className="border-b border-transparent px-0 py-1 text-sm text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
              >
                清除
              </Link>
            ) : null}
          </div>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {query ? `找到 ${managedUsers.length} 位匹配读者` : `共 ${managedUsers.length} 位读者`}
        </p>
      </section>

      {managedUsers.length > 0 ? (
        <section className="grid gap-0">
          {managedUsers.map((user) => (
            <UserRow key={user.id} user={user} canManageReaders={canManageReaders} />
          ))}
        </section>
      ) : (
        <EmptyPanel
          text={
            query
              ? "没有找到匹配的读者。换个关键词试试。"
              : "还没有公开登录用户。先用右上角登录一次，再回到这里设置管理员权限。"
          }
        />
      )}
    </div>
  );
}

function UserRow({ user, canManageReaders }: { user: UserListItem; canManageReaders: boolean }) {
  const displayName = user.name ?? user.email ?? "未命名用户";

  return (
    <article className="grid gap-4 border-b border-zinc-200/80 py-5 first:pt-0 last:border-b-0 dark:border-zinc-800/80 md:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          {user.image ? (
            <span
              className="size-9 rounded-full bg-cover bg-center bg-no-repeat ring-1 ring-zinc-200/80 dark:ring-zinc-800/80"
              style={{ backgroundImage: `url(${user.image})` }}
            />
          ) : (
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/10">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium text-zinc-950 dark:text-zinc-50">{displayName}</p>
              <RoleBadge role={user.role} />
            </div>
            {user.email ? (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
            ) : null}
          </div>
        </div>

        {user.accounts.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            {user.accounts.map((account) => (
              <span
                key={`${account.provider}:${account.providerAccountId}`}
                className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-900"
              >
                {account.provider} · {account.providerAccountId}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3 md:justify-end">
        {user.role === UserRole.OWNER ? (
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Owner 受保护</span>
        ) : user.role === UserRole.ADMIN ? (
          <>
            <RoleForm
              userId={user.id}
              role={UserRole.USER}
              label="设为普通用户"
              disabled={!canManageReaders}
            />
            <DeleteUserForm userId={user.id} disabled={!canManageReaders} />
          </>
        ) : (
          <>
            <RoleForm
              userId={user.id}
              role={UserRole.ADMIN}
              label="设为管理员"
              disabled={!canManageReaders}
            />
            <DeleteUserForm userId={user.id} disabled={!canManageReaders} />
          </>
        )}
      </div>
    </article>
  );
}

function RoleForm({
  userId,
  role,
  label,
  disabled,
}: {
  userId: string;
  role: UserRole;
  label: string;
  disabled: boolean;
}) {
  return (
    <form action={setUserRoleAction}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="role" value={role} />
      <button
        type="submit"
        disabled={disabled}
        className="border-b border-transparent px-0 py-1 text-xs font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-45 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
      >
        {label}
      </button>
    </form>
  );
}

function DeleteUserForm({ userId, disabled }: { userId: string; disabled: boolean }) {
  return (
    <form action={deleteUserAction}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={disabled}
        className="border-b border-transparent px-0 py-1 text-xs font-medium text-rose-600 transition hover:border-rose-200 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-45 dark:text-rose-400 dark:hover:border-rose-900 dark:hover:text-rose-300"
      >
        删除用户
      </button>
    </form>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const isOwner = role === UserRole.OWNER;
  const isAdmin = role === UserRole.ADMIN;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        isOwner
          ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
          : isAdmin
            ? "bg-primary/10 text-primary"
            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
      }`}
    >
      {isOwner ? "Owner" : isAdmin ? "管理员" : "用户"}
    </span>
  );
}

function matchesReaderQuery(user: UserListItem, query: string) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLocaleLowerCase();
  const haystacks = [
    user.name,
    user.email,
    user.username,
    user.role,
    ...user.accounts.flatMap((account) => [account.provider, account.providerAccountId]),
  ];

  return haystacks.some(
    (value) => typeof value === "string" && value.toLocaleLowerCase().includes(normalizedQuery),
  );
}
