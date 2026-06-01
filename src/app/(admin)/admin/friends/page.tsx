import Link from "next/link";
import { FriendLinkApplicationStatus } from "@prisma/client";
import { FriendLinkActionMenu } from "@/app/(admin)/admin/manage/friend-link-action-menu";
import { CreateFriendLinkDialog } from "@/app/(admin)/admin/manage/create-friend-link-dialog";
import { FriendsPageToast } from "@/app/(admin)/admin/friends/page-toast";
import {
  approveFriendLinkApplicationAction,
  rejectFriendLinkApplicationAction,
} from "@/app/(admin)/admin/manage/application-actions";
import { createFriendLinkAction } from "@/app/(admin)/admin/manage/actions";
import { EmptyPanel } from "@/app/(admin)/admin/ui";
import { formatAdminDateTime, formatAdminNumber } from "@/app/(admin)/admin/utils";
import {
  getFriendLinkApplicationStats,
  listFriendLinkApplicationsForAdmin,
} from "@/server/repositories/friend-link-applications";
import { listFriendLinksForAdmin } from "@/server/repositories/friend-links";

type AdminFriendsPageProps = {
  searchParams?: Promise<{
    notice?: string;
    error?: string;
    status?: string;
  }>;
};

export default async function AdminFriendsPage({
  searchParams,
}: AdminFriendsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeProcessedStatus =
    resolvedSearchParams?.status === "rejected" ? "rejected" : "approved";
  const [items, pendingApplications, approvedApplications, rejectedApplications, applicationStats] =
    await Promise.all([
      listFriendLinksForAdmin(),
      listFriendLinkApplicationsForAdmin(FriendLinkApplicationStatus.PENDING),
      listFriendLinkApplicationsForAdmin(FriendLinkApplicationStatus.APPROVED),
      listFriendLinkApplicationsForAdmin(FriendLinkApplicationStatus.REJECTED),
      getFriendLinkApplicationStats(),
    ]);
  const friendLinksById = new Map(items.map((item) => [item.id, item]));
  const processedApplications =
    activeProcessedStatus === "approved"
      ? approvedApplications
      : rejectedApplications;

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">友链管理</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CreateFriendLinkDialog action={createFriendLinkAction} />
          </div>
        </div>
      </section>

      <FriendsPageToast
        notice={resolvedSearchParams?.notice ?? null}
        error={resolvedSearchParams?.error ?? null}
      />

      <section className="grid gap-4">
        <div className="grid gap-1">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">待审核申请</h2>
        </div>

        {pendingApplications.length > 0 ? (
          <div className="grid gap-0">
            {pendingApplications.map((application) => (
              <ApplicationRow
                key={application.id}
                application={application}
                actions={(currentApplication) => (
                  <>
                    <form action={approveFriendLinkApplicationAction}>
                      <input type="hidden" name="id" value={currentApplication.id} />
                      <button
                        type="submit"
                        className="border-b border-transparent py-1 text-xs font-medium text-emerald-600 transition hover:border-emerald-200 hover:text-emerald-700 dark:text-emerald-400 dark:hover:border-emerald-900 dark:hover:text-emerald-300"
                      >
                        通过
                      </button>
                    </form>
                    <form action={rejectFriendLinkApplicationAction}>
                      <input type="hidden" name="id" value={currentApplication.id} />
                      <button
                        type="submit"
                        className="border-b border-transparent py-1 text-xs font-medium text-rose-600 transition hover:border-rose-200 hover:text-rose-700 dark:text-rose-400 dark:hover:border-rose-900 dark:hover:text-rose-300"
                      >
                        拒绝
                      </button>
                    </form>
                  </>
                )}
              />
            ))}
          </div>
        ) : (
          <EmptyPanel text="当前没有待审核申请。" />
        )}
      </section>

      <section className="grid gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-1">
            <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">已处理申请</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "已通过", value: "approved" as const, count: applicationStats.approved },
              { label: "已拒绝", value: "rejected" as const, count: applicationStats.rejected },
            ].map((item) => (
              <Link
                key={item.value}
                href={getFriendsFilterHref(item.value)}
                className={[
                  "inline-flex h-9 items-center gap-2 rounded-2xl px-3 text-sm font-medium transition",
                  item.value === activeProcessedStatus
                    ? "bg-primary/10 text-primary"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                ].join(" ")}
              >
                {item.label}
                <span
                  className={[
                    "inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[0.68rem]",
                    item.value === activeProcessedStatus
                      ? "bg-white/80 text-primary dark:bg-white/10"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
                  ].join(" ")}
                >
                  {formatAdminNumber(item.count)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {processedApplications.length > 0 ? (
          <div className="grid gap-0">
            {processedApplications.map((application) => (
              <ApplicationRow
                key={application.id}
                application={application}
                friendLinkItem={
                  activeProcessedStatus === "approved" && application.friendLinkId
                    ? friendLinksById.get(application.friendLinkId) ?? null
                    : null
                }
              />
            ))}
          </div>
        ) : (
          <EmptyPanel
            text={
              activeProcessedStatus === "approved"
                ? "还没有已通过申请。"
                : "还没有已拒绝申请。"
            }
          />
        )}
      </section>
    </div>
  );
}

function ApplicationRow({
  application,
  actions,
  friendLinkItem = null,
}: {
  application: Awaited<ReturnType<typeof listFriendLinkApplicationsForAdmin>>[number];
  actions?: (
    application: Awaited<ReturnType<typeof listFriendLinkApplicationsForAdmin>>[number],
  ) => React.ReactNode;
  friendLinkItem?: Awaited<ReturnType<typeof listFriendLinksForAdmin>>[number] | null;
}) {
  return (
    <article
      className={[
        "grid gap-4 border-b py-5 first:pt-0 last:border-b-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_auto]",
        application.status === FriendLinkApplicationStatus.PENDING
          ? "border-amber-200/80 dark:border-amber-400/20"
          : "border-zinc-200/80 dark:border-zinc-800/80",
      ].join(" ")}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {application.nickname ? (
            <span className="font-medium text-zinc-950 dark:text-zinc-50">{application.nickname}</span>
          ) : null}
          <p className="font-medium text-zinc-950 dark:text-zinc-50">{application.siteName}</p>
          <ApplicationStatusBadge status={application.status} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{application.contactEmail}</span>
          <span>{formatAdminDateTime(application.createdAt)}</span>
          {application.reviewedAt ? (
            <span>处理于 {formatAdminDateTime(application.reviewedAt)}</span>
          ) : null}
        </div>

        {application.description ? (
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-700 dark:text-zinc-200">
            {application.description}
          </p>
        ) : null}

        {application.message ? (
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            {application.message}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <Link
            href={application.siteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border-b border-transparent py-1 text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
          >
            <span className="max-w-[22rem] truncate">站点 · {application.siteUrl}</span>
          </Link>
          {friendLinkItem ? (
            <span className="text-zinc-500 dark:text-zinc-400">
              {friendLinkItem.isVisible ? "公开" : "隐藏"}
            </span>
          ) : null}
        </div>
      </div>

      {actions || application.status !== FriendLinkApplicationStatus.PENDING ? (
        <div className="flex min-w-[10rem] items-start justify-start gap-4 lg:justify-end">
          {application.status !== FriendLinkApplicationStatus.PENDING ? (
            <FriendLinkActionMenu
              applicationId={application.id}
              friendLinkDefaults={
                friendLinkItem
                  ? {
                      id: friendLinkItem.id,
                      name: friendLinkItem.name,
                      url: friendLinkItem.url,
                      description: friendLinkItem.description,
                      avatarUrl: friendLinkItem.avatarUrl,
                      location: friendLinkItem.location,
                      feedUrl: friendLinkItem.feedUrl,
                      email: friendLinkItem.email,
                      sortOrder: friendLinkItem.sortOrder,
                      isVisible: friendLinkItem.isVisible,
                    }
                  : null
              }
              status={application.status}
            />
          ) : null}
          {actions ? actions(application) : null}
        </div>
      ) : null}
    </article>
  );
}

function ApplicationStatusBadge({
  status,
}: {
  status: FriendLinkApplicationStatus;
}) {
  const className =
    status === FriendLinkApplicationStatus.APPROVED
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
      : status === FriendLinkApplicationStatus.REJECTED
        ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
        : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
  const label =
    status === FriendLinkApplicationStatus.APPROVED
      ? "已通过"
      : status === FriendLinkApplicationStatus.REJECTED
        ? "已拒绝"
        : "待审核";

  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{label}</span>;
}

function getFriendsFilterHref(status: "approved" | "rejected") {
  const params = new URLSearchParams();
  params.set("status", status);

  return `/admin/friends?${params.toString()}`;
}
