import Link from "next/link";
import { ContentStatus, StandalonePageNavGroup } from "@prisma/client";
import {
  deletePostsBulkAction,
  deleteStandalonePagesBulkAction,
  deleteUpdatesBulkAction,
  publishPostsBulkAction,
  publishStandalonePagesBulkAction,
  publishUpdatesBulkAction,
  unpublishPostsBulkAction,
  unpublishStandalonePagesBulkAction,
  unpublishUpdatesBulkAction,
} from "@/app/(admin)/admin/actions";
import {
  AlignLeft,
  ArrowDown,
  CalendarDays,
  Clock3,
  ExternalLink,
  FilePenLine,
  Hash,
  Heart,
  MessageSquare,
  Plus,
} from "lucide-react";
import { EmptyPanel } from "@/app/(admin)/admin/ui";
import { BulkSelectToggle } from "@/app/(admin)/admin/bulk-select-toggle";
import { LiveSearchInput } from "@/app/(admin)/admin/live-search-input";
import { WorkbenchCategoryPanel } from "@/app/(admin)/admin/workbench/workbench-category-panel";
import { PostActionMenu } from "@/app/(admin)/admin/workbench/post-action-menu";
import { StandalonePageActionMenu } from "@/app/(admin)/admin/workbench/standalone-page-action-menu";
import { TagCloudPanel } from "@/app/(admin)/admin/workbench/tag-cloud-panel";
import { UpdateActionMenu } from "@/app/(admin)/admin/workbench/update-action-menu";
import { CreateUpdateDialog } from "@/app/(admin)/admin/updates/new/new-update-entry";
import { formatAdminNumber } from "@/app/(admin)/admin/utils";
import { getContentText } from "@/lib/content";
import { getPostPath } from "@/lib/routes";
import type { CategoryOption } from "@/server/repositories/categories";
import { listPostsForAdmin } from "@/server/repositories/posts";
import { listStandalonePagesForAdmin } from "@/server/repositories/standalone-pages";
import { listTags } from "@/server/repositories/tags";
import { listUpdatesForAdmin } from "@/server/repositories/updates";

export type AdminSortField = "created" | "published" | "updated" | "category";
export type AdminSortDirection = "asc" | "desc";
export type AdminSortValue = `${AdminSortField}-${AdminSortDirection}`;

export function getAdminSortValue(value?: string) {
  if (
    value === "created-asc" ||
    value === "created-desc" ||
    value === "published-asc" ||
    value === "published-desc" ||
    value === "updated-asc" ||
    value === "updated-desc" ||
    value === "category-asc" ||
    value === "category-desc"
  ) {
    return value;
  }

  return "updated-desc";
}

export function getAdminQueryValue(value?: string) {
  return value?.trim() ?? "";
}

export function sortAdminPosts(
  items: Awaited<ReturnType<typeof listPostsForAdmin>>,
  sort: AdminSortValue,
) {
  const nextItems = [...items];
  const { field, direction } = getAdminSortMeta(sort);

  nextItems.sort((left, right) => {
    if (field === "category") {
      const leftValue = left.category?.name ?? "未分类";
      const rightValue = right.category?.name ?? "未分类";
      const compared = leftValue.localeCompare(rightValue, "zh-Hans-CN");

      return direction === "asc" ? compared : -compared;
    }

    const leftValue =
      field === "created"
        ? left.createdAt
        : field === "published"
          ? left.publishedAt
          : left.updatedAt;
    const rightValue =
      field === "created"
        ? right.createdAt
        : field === "published"
          ? right.publishedAt
          : right.updatedAt;

    return direction === "asc"
      ? compareDates(leftValue, rightValue)
      : compareDates(rightValue, leftValue);
  });

  return nextItems;
}

export function sortAdminUpdates(
  items: Awaited<ReturnType<typeof listUpdatesForAdmin>>,
  sort: AdminSortValue,
) {
  const nextItems = [...items];
  const { field, direction } = getAdminSortMeta(sort);

  nextItems.sort((left, right) => {
    const resolvedField = field === "published" ? "updated" : field;
    const leftValue = resolvedField === "created" ? left.createdAt : left.updatedAt;
    const rightValue = resolvedField === "created" ? right.createdAt : right.updatedAt;

    return direction === "asc"
      ? compareDates(leftValue, rightValue)
      : compareDates(rightValue, leftValue);
  });

  return nextItems;
}

export function filterAdminPosts(
  items: Awaited<ReturnType<typeof listPostsForAdmin>>,
  query: string,
) {
  if (!query) {
    return items;
  }

  const normalizedQuery = query.toLocaleLowerCase("zh-CN");

  return items.filter((item) => {
    const haystack = [
      item.title,
      item.slug,
      item.summary ?? "",
      item.authorName ?? "",
      item.category?.name ?? "",
      ...item.tags.map((tag) => tag.name),
    ]
      .join(" ")
      .toLocaleLowerCase("zh-CN");

    return haystack.includes(normalizedQuery);
  });
}

export function sortAdminStandalonePages(
  items: Awaited<ReturnType<typeof listStandalonePagesForAdmin>>,
  sort: AdminSortValue,
) {
  const nextItems = [...items];
  const { field, direction } = getAdminSortMeta(sort);
  const resolvedField = field === "category" || field === "published" ? "updated" : field;

  nextItems.sort((left, right) => {
    const leftValue = resolvedField === "created" ? left.createdAt : left.updatedAt;
    const rightValue = resolvedField === "created" ? right.createdAt : right.updatedAt;

    return direction === "asc"
      ? compareDates(leftValue, rightValue)
      : compareDates(rightValue, leftValue);
  });

  return nextItems;
}

export function filterAdminStandalonePages(
  items: Awaited<ReturnType<typeof listStandalonePagesForAdmin>>,
  query: string,
) {
  if (!query) {
    return items;
  }

  const normalizedQuery = query.toLocaleLowerCase("zh-CN");

  return items.filter((item) => {
    const haystack = [
      item.title,
      item.slug,
      item.navLabel ?? "",
      item.seoTitle ?? "",
      item.seoDescription ?? "",
    ]
      .join("\n")
      .toLocaleLowerCase("zh-CN");

    return haystack.includes(normalizedQuery);
  });
}

export function filterVisibleAdminStandalonePages(
  items: Awaited<ReturnType<typeof listStandalonePagesForAdmin>>,
) {
  return items.filter((item) => item.status !== ContentStatus.ARCHIVED);
}

export function filterTrashedAdminStandalonePages(
  items: Awaited<ReturnType<typeof listStandalonePagesForAdmin>>,
) {
  return items.filter((item) => item.status === ContentStatus.ARCHIVED);
}

export function filterVisibleAdminPosts(items: Awaited<ReturnType<typeof listPostsForAdmin>>) {
  return items.filter((item) => item.status !== ContentStatus.ARCHIVED);
}

export function filterTrashedAdminPosts(items: Awaited<ReturnType<typeof listPostsForAdmin>>) {
  return items.filter((item) => item.status === ContentStatus.ARCHIVED);
}

export function filterAdminUpdates(
  items: Awaited<ReturnType<typeof listUpdatesForAdmin>>,
  query: string,
) {
  if (!query) {
    return items;
  }

  const normalizedQuery = query.toLocaleLowerCase("zh-CN");

  return items.filter((item) => {
    const haystack = [
      item.title,
      item.authorName ?? "",
      getContentText(item.contentHtml, item.content),
    ]
      .join(" ")
      .toLocaleLowerCase("zh-CN");

    return haystack.includes(normalizedQuery);
  });
}

export function filterVisibleAdminUpdates(items: Awaited<ReturnType<typeof listUpdatesForAdmin>>) {
  return items.filter((item) => item.status !== ContentStatus.ARCHIVED);
}

export function filterTrashedAdminUpdates(items: Awaited<ReturnType<typeof listUpdatesForAdmin>>) {
  return items.filter((item) => item.status === ContentStatus.ARCHIVED);
}

export function AdminPostsSection({
  items,
  sort,
  query,
}: {
  items: Awaited<ReturnType<typeof listPostsForAdmin>>;
  sort: AdminSortValue;
  query: string;
}) {
  return (
    <section className="grid gap-5">
      <ContentTableToolbar
        createHref="/admin/posts/new"
        createLabel="创建文章"
        query={query}
        sort={sort}
        basePath="/admin/posts"
      />
      <AdminPostsTable items={items} sort={sort} query={query} />
    </section>
  );
}

export function AdminUpdatesSection({
  items,
  sort,
  query,
}: {
  items: Awaited<ReturnType<typeof listUpdatesForAdmin>>;
  sort: AdminSortValue;
  query: string;
}) {
  return (
    <section className="grid gap-5">
      <ContentTableToolbar
        createHref="/admin/updates/new"
        createLabel="创建动态"
        query={query}
        sort={sort}
        basePath="/admin/updates"
      />
      <AdminUpdatesTable items={items} sort={sort} query={query} />
    </section>
  );
}

export function AdminPagesSection({
  items,
  sort,
  query,
}: {
  items: Awaited<ReturnType<typeof listStandalonePagesForAdmin>>;
  sort: AdminSortValue;
  query: string;
}) {
  return (
    <section className="grid gap-5">
      <ContentTableToolbar
        createHref="/admin/pages/new"
        createLabel="新独立页面"
        query={query}
        sort={sort}
        basePath="/admin/pages"
      />
      <AdminStandalonePagesTable items={items} sort={sort} query={query} />
    </section>
  );
}

export function AdminCategoriesSection({
  postCategories,
}: {
  postCategories: CategoryOption[];
}) {
  return (
    <section className="grid gap-5">
      <WorkbenchCategoryPanel postCategories={postCategories} />
    </section>
  );
}

export function AdminTaxonomySection({
  postCategories,
  tags,
  posts,
}: {
  postCategories: CategoryOption[];
  tags: Awaited<ReturnType<typeof listTags>>;
  posts: Awaited<ReturnType<typeof listPostsForAdmin>>;
}) {
  return (
    <section className="grid gap-10">
      <AdminCategoriesSection postCategories={postCategories} />
      <AdminTagsSection tags={tags} posts={posts} />
    </section>
  );
}

export function AdminTagsSection({
  tags,
  posts,
}: {
  tags: Awaited<ReturnType<typeof listTags>>;
  posts: Awaited<ReturnType<typeof listPostsForAdmin>>;
}) {
  return (
    <section className="grid gap-5">
      <TagCloudPanel items={getTagCloudItems(tags, posts)} />
    </section>
  );
}

function ContentTableToolbar({
  createHref,
  createLabel,
  query,
  sort,
  basePath,
}: {
  createHref: string;
  createLabel: string;
  query: string;
  sort?: AdminSortValue;
  basePath?: string;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <form action={basePath ?? ""} className="flex min-w-0 flex-1 items-center gap-3">
        {sort ? <input type="hidden" name="sort" value={sort} /> : null}
        <LiveSearchInput defaultValue={query} sort={sort} />
      </form>
      <div className="flex flex-wrap items-center gap-3">
        {createHref === "/admin/updates/new" ? (
          <CreateUpdateDialog
            triggerLabel={createLabel}
            triggerClassName="inline-flex h-10 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          />
        ) : (
          <Link
            href={createHref}
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            {createLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

function AdminPostsTable({
  items,
  sort,
  query,
}: {
  items: Awaited<ReturnType<typeof listPostsForAdmin>>;
  sort: AdminSortValue;
  query: string;
}) {
  if (items.length === 0) {
    return <EmptyPanel text={query ? "没有匹配的文章结果。" : "还没有文章内容。"} />;
  }

  return (
    <div className="bulk-selection-form grid gap-3">
      <form id="posts-bulk-form" />
      <BulkActionBar
        formId="posts-bulk-form"
        publishAction={publishPostsBulkAction}
        unpublishAction={unpublishPostsBulkAction}
        deleteAction={deletePostsBulkAction}
        selectionLabel="已选文章"
      />
      <AdminDataTable
        bulkFormId="posts-bulk-form"
        bulkCheckboxName="ids"
        columns={[
          { key: "select", label: "", className: "2.25rem" },
          { key: "title", label: "标题", className: "minmax(14rem,2.15fr)" },
          { key: "category", label: "分类", className: "minmax(5.5rem,0.8fr)", sortable: "category" },
          { key: "tags", label: "标签", className: "minmax(4.75rem,0.68fr)" },
          { key: "words", label: "字数", className: "4.1rem", align: "right", icon: AlignLeft },
          { key: "comments", label: "评论", className: "4.75rem", align: "right", icon: MessageSquare },
          { key: "likes", label: "点赞", className: "4.75rem", align: "right", icon: Heart },
          { key: "published", label: "发布于", className: "6.5rem", sortable: "published", icon: CalendarDays, align: "right" },
          { key: "updated", label: "修改于", className: "6.5rem", sortable: "updated", icon: Clock3, align: "right" },
          { key: "status", label: "状态", className: "5.75rem" },
          { key: "actions", label: "操作", className: "4.5rem" },
        ]}
        items={items}
        sort={sort}
        query={query}
        basePath="/admin/posts"
        emptyText="没有匹配的文章结果。"
        renderMobileRow={(item) => (
          <AdminPostMobileRow item={item} />
        )}
        renderRow={(item) => (
          <>
            <div className="hidden lg:flex items-center">
              <input
                type="checkbox"
                name="ids"
                value={item.id}
                form="posts-bulk-form"
                className="h-4 w-4 rounded-[5px] border-zinc-300 text-primary focus:ring-primary/30 dark:border-white/15"
              />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <Link
                  href={`/admin/posts/${encodeURIComponent(item.id)}`}
                  className="truncate text-[15px] font-medium leading-6 text-zinc-900 transition hover:text-primary dark:text-zinc-50"
                >
                  {item.title}
                </Link>
                {item.status === ContentStatus.PUBLISHED && item.draftSnapshot ? (
                  <span className="inline-flex h-6 items-center rounded-full bg-amber-100/70 px-2 text-[11px] font-medium text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                    有修订
                  </span>
                ) : null}
                {item.status === ContentStatus.PUBLISHED ? (
                  <a
                    href={getPostPath({ slug: item.slug, categorySlug: item.category?.slug })}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-[rgb(var(--primary-rgb)/0.08)] hover:text-primary dark:text-zinc-500"
                    aria-label="查看站点文章"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-300 dark:text-zinc-700"
                    aria-label="未发布，无法查看站点文章"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                )}
                <Link
                  href={`/admin/posts/${encodeURIComponent(item.id)}`}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-[rgb(var(--primary-rgb)/0.08)] hover:text-primary dark:text-zinc-500"
                  aria-label="编辑文章"
                >
                  <FilePenLine className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-300">{item.category?.name ?? "未分类"}</div>
            <div className="min-w-0 text-sm text-zinc-500 dark:text-zinc-400">
              <div className="truncate">{item.tags.length > 0 ? item.tags.map((tag) => tag.name).join(", ") : "—"}</div>
            </div>
            <TableMetric value={formatAdminNumber(getTableWordCount(item.contentHtml, item.content))} />
            <TableMetric value={formatAdminNumber(item.commentCount)} />
            <TableMetric value={formatAdminNumber(item.likeCount)} />
            <TableDate value={item.publishedAt} emptyText="未发布" />
            <TableDate value={item.updatedAt} />
            <div>
              <TableStatus status={item.status} />
            </div>
            <div className="justify-self-start text-sm">
              <PostActionMenu
                postId={item.id}
                isPublished={item.status === ContentStatus.PUBLISHED}
                editHref={`/admin/posts/${encodeURIComponent(item.id)}`}
              />
            </div>
          </>
        )}
      />
    </div>
  );
}

function AdminUpdatesTable({
  items,
  sort,
  query,
}: {
  items: Awaited<ReturnType<typeof listUpdatesForAdmin>>;
  sort: AdminSortValue;
  query: string;
}) {
  if (items.length === 0) {
    return <EmptyPanel text={query ? "没有匹配的动态结果。" : "还没有动态内容。"} />;
  }

  return (
    <div className="bulk-selection-form grid gap-3">
      <form id="updates-bulk-form" />
      <BulkActionBar
        formId="updates-bulk-form"
        publishAction={publishUpdatesBulkAction}
        unpublishAction={unpublishUpdatesBulkAction}
        deleteAction={deleteUpdatesBulkAction}
        selectionLabel="已选动态"
      />
      <AdminDataTable
        bulkFormId="updates-bulk-form"
        bulkCheckboxName="ids"
        columns={[
          { key: "select", label: "", className: "2.25rem" },
          { key: "title", label: "内容", className: "minmax(17rem,2.6fr)" },
          { key: "author", label: "作者", className: "5.5rem" },
          { key: "words", label: "字数", className: "4.1rem", align: "right", icon: AlignLeft },
          { key: "created", label: "创建于", className: "6.5rem", sortable: "created", icon: CalendarDays, align: "right" },
          { key: "updated", label: "修改于", className: "6.5rem", sortable: "updated", icon: Clock3, align: "right" },
          { key: "status", label: "状态", className: "5.75rem" },
          { key: "actions", label: "操作", className: "4.5rem" },
        ]}
        items={items}
        sort={sort}
        query={query}
        basePath="/admin/updates"
        emptyText="没有匹配的动态结果。"
        renderMobileRow={(item) => (
          <AdminUpdateMobileRow item={item} />
        )}
        renderRow={(item) => {
          const primaryText = getContentText(item.contentHtml, item.content) || item.title;

          return (
            <>
              <div className="hidden lg:flex items-center">
                <input
                  type="checkbox"
                  name="ids"
                  value={item.id}
                  form="updates-bulk-form"
                  className="h-4 w-4 rounded-[5px] border-zinc-300 text-primary focus:ring-primary/30 dark:border-white/15"
                />
              </div>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <Link
                    href={`/admin/updates/${encodeURIComponent(item.id)}`}
                    className="truncate text-[15px] font-medium leading-6 text-zinc-900 transition hover:text-primary dark:text-zinc-50"
                  >
                    {primaryText}
                  </Link>
                  <Link
                    href={`/admin/updates/${encodeURIComponent(item.id)}`}
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-[rgb(var(--primary-rgb)/0.08)] hover:text-primary dark:text-zinc-500"
                    aria-label="编辑动态"
                  >
                    <FilePenLine className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-300">{item.authorName ?? "未署名"}</div>
              <TableMetric value={formatAdminNumber(getTableWordCount(item.contentHtml, item.content))} />
              <TableDate value={item.createdAt} />
              <TableDate value={item.updatedAt} />
              <div>
                <TableStatus status={item.status} />
              </div>
              <div className="justify-self-start text-sm">
                <UpdateActionMenu
                  isPublished={item.status === ContentStatus.PUBLISHED}
                  updateId={item.id}
                  editHref={`/admin/updates/${encodeURIComponent(item.id)}`}
                />
              </div>
            </>
          );
        }}
      />
    </div>
  );
}

function AdminStandalonePagesTable({
  items,
  sort,
  query,
}: {
  items: Awaited<ReturnType<typeof listStandalonePagesForAdmin>>;
  sort: AdminSortValue;
  query: string;
}) {
  if (items.length === 0) {
    return <EmptyPanel text={query ? "没有匹配的独立页面结果。" : "还没有独立页面。"} />;
  }

  return (
    <div className="bulk-selection-form grid gap-3">
      <form id="pages-bulk-form" />
      <BulkActionBar
        formId="pages-bulk-form"
        publishAction={publishStandalonePagesBulkAction}
        unpublishAction={unpublishStandalonePagesBulkAction}
        deleteAction={deleteStandalonePagesBulkAction}
        selectionLabel="已选独立页面"
      />
      <AdminDataTable
        bulkFormId="pages-bulk-form"
        bulkCheckboxName="ids"
        columns={[
          { key: "select", label: "", className: "2.25rem" },
          { key: "title", label: "标题", className: "minmax(14rem,2.1fr)" },
          { key: "slug", label: "路径", className: "minmax(8rem,1fr)" },
          { key: "nav", label: "导航", className: "minmax(8rem,0.9fr)" },
          { key: "created", label: "创建于", className: "6.5rem", sortable: "created", icon: CalendarDays, align: "right" },
          { key: "updated", label: "修改于", className: "6.5rem", sortable: "updated", icon: Clock3, align: "right" },
          { key: "status", label: "状态", className: "5.75rem" },
          { key: "actions", label: "操作", className: "4.5rem" },
        ]}
        items={items}
        sort={sort}
        query={query}
        basePath="/admin/pages"
        emptyText="没有匹配的独立页面结果。"
        renderMobileRow={(item) => <AdminStandalonePageMobileRow item={item} />}
        renderRow={(item) => (
          <>
            <div className="hidden lg:flex items-center">
              <input
                type="checkbox"
                name="ids"
                value={item.id}
                form="pages-bulk-form"
                className="h-4 w-4 rounded-[5px] border-zinc-300 text-primary focus:ring-primary/30 dark:border-white/15"
              />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <Link
                  href={`/admin/pages/${encodeURIComponent(item.id)}`}
                  className="truncate text-[15px] font-medium leading-6 text-zinc-900 transition hover:text-primary dark:text-zinc-50"
                >
                  {item.title}
                </Link>
                {item.status === ContentStatus.PUBLISHED && item.draftSnapshot ? (
                  <span className="inline-flex h-6 items-center rounded-full bg-amber-100/70 px-2 text-[11px] font-medium text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                    有修订
                  </span>
                ) : null}
                {item.status === ContentStatus.PUBLISHED ? (
                  <a
                    href={`/${item.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-[rgb(var(--primary-rgb)/0.08)] hover:text-primary dark:text-zinc-500"
                    aria-label="查看站点页面"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-300 dark:text-zinc-700"
                    aria-label="未发布，无法查看站点页面"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                )}
                <Link
                  href={`/admin/pages/${encodeURIComponent(item.id)}`}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-[rgb(var(--primary-rgb)/0.08)] hover:text-primary dark:text-zinc-500"
                  aria-label="编辑独立页面"
                >
                  <FilePenLine className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-300">/{item.slug}</div>
            <div className="min-w-0 text-sm text-zinc-500 dark:text-zinc-400">
              {item.showInNav ? `${item.navGroup === StandalonePageNavGroup.HOME ? "起点" : "更多"} · ${item.navLabel ?? item.title}` : "不显示"}
            </div>
            <TableDate value={item.createdAt} />
            <TableDate value={item.updatedAt} />
            <div>
              <TableStatus status={item.status} />
            </div>
            <div className="justify-self-start text-sm">
              <StandalonePageActionMenu
                standalonePageId={item.id}
                isPublished={item.status === ContentStatus.PUBLISHED}
                editHref={`/admin/pages/${encodeURIComponent(item.id)}`}
              />
            </div>
          </>
        )}
      />
    </div>
  );
}

function BulkActionBar({
  formId,
  publishAction,
  unpublishAction,
  deleteAction,
  selectionLabel,
}: {
  formId: string;
  publishAction: (formData: FormData) => void | Promise<void>;
  unpublishAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  selectionLabel: string;
}) {
  return (
    <div className="bulk-action-bar items-center justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectionLabel}后可直接批量操作</p>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          form={formId}
          formAction={publishAction}
          className="inline-flex h-9 items-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:border-white/20"
        >
          发布
        </button>
        <button
          type="submit"
          form={formId}
          formAction={unpublishAction}
          className="inline-flex h-9 items-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:border-white/20"
        >
          转草稿
        </button>
        <button
          type="submit"
          form={formId}
          formAction={deleteAction}
          className="inline-flex h-9 items-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
        >
          移到回收站
        </button>
      </div>
    </div>
  );
}

function AdminDataTable<T>({
  bulkFormId,
  bulkCheckboxName,
  columns,
  items,
  sort,
  query,
  basePath,
  emptyText,
  renderMobileRow,
  renderRow,
}: {
  bulkFormId?: string;
  bulkCheckboxName?: string;
  columns: Array<{
    key: string;
    label: string;
    className: string;
    align?: "left" | "right";
    sortable?: AdminSortField;
    icon?: typeof Hash;
  }>;
  items: T[];
  sort: AdminSortValue;
  query: string;
  basePath: string;
  emptyText: string;
  renderMobileRow?: (item: T) => React.JSX.Element;
  renderRow: (item: T) => React.JSX.Element;
}) {
  if (items.length === 0) {
    return <EmptyPanel text={emptyText} />;
  }

  const templateColumns = columns.map((column) => column.className).join(" ");
  const activeSort = getAdminSortMeta(sort);

  return (
    <section className="relative overflow-visible">
      <div className="hidden border-b border-zinc-200/80 lg:block dark:border-white/10">
        <div className="grid items-center gap-3 px-5 py-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-200" style={{ gridTemplateColumns: templateColumns }}>
          {columns.map((column) => (
            <div
              key={column.key}
              className={`min-w-0 ${column.align === "right" ? "text-right" : ""}`}
            >
              {column.sortable ? (
                <Link
                  href={buildAdminListHref(basePath, column.sortable, sort, query)}
                  className={`inline-flex items-center gap-2 transition ${
                    column.align === "right" ? "w-full justify-end" : ""
                  } ${
                    activeSort.field === column.sortable ? "text-primary" : "hover:text-primary"
                  }`}
                >
                  {column.icon ? <column.icon className="h-4 w-4" /> : null}
                  <span>{column.label}</span>
                  <ArrowDown
                    className={`h-3.5 w-3.5 transition ${
                      activeSort.field === column.sortable
                        ? `opacity-100 ${activeSort.direction === "asc" ? "rotate-180" : ""}`
                        : "opacity-35"
                    }`}
                  />
                </Link>
              ) : (
                column.key === "select" && bulkFormId && bulkCheckboxName ? (
                  <span className="inline-flex items-center">
                    <BulkSelectToggle formId={bulkFormId} checkboxName={bulkCheckboxName} />
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-2 ${column.align === "right" ? "justify-end w-full" : ""}`}>
                    {column.icon ? <column.icon className="h-4 w-4" /> : null}
                    <span>{column.label}</span>
                  </span>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="divide-y divide-zinc-200/80 dark:divide-white/10">
        {items.map((item, index) => (
          <article key={index} className="px-4 py-4 transition hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] lg:px-5 lg:py-4">
            <div className="hidden items-center gap-3 lg:grid" style={{ gridTemplateColumns: templateColumns }}>
              {renderRow(item)}
            </div>
            <div className="lg:hidden">
              {renderMobileRow ? renderMobileRow(item) : renderCompactRow(columns, renderRow(item))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminPostMobileRow({
  item,
}: {
  item: Awaited<ReturnType<typeof listPostsForAdmin>>[number];
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <div className="min-w-0 w-full">
        <div className="overflow-hidden">
          <Link
            href={`/admin/posts/${encodeURIComponent(item.id)}`}
            className="block w-full truncate text-[15px] font-medium leading-6 text-zinc-900 dark:text-zinc-50"
          >
            {item.title}
          </Link>
        </div>
      </div>
      <div className="flex shrink-0 items-center pl-1 text-zinc-400 dark:text-zinc-500">
        <PostActionMenu
          postId={item.id}
          isPublished={item.status === ContentStatus.PUBLISHED}
          editHref={`/admin/posts/${encodeURIComponent(item.id)}`}
          viewHref={
            item.status === ContentStatus.PUBLISHED
              ? getPostPath({ slug: item.slug, categorySlug: item.category?.slug })
              : undefined
          }
          compact
        />
      </div>
      <div className="col-span-2 mt-1 grid grid-cols-[auto_auto_auto_minmax(0,1fr)_auto] items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex h-8 min-w-0 max-w-[5.5rem] items-center truncate rounded-xl bg-zinc-100 px-2.5 text-zinc-700 dark:bg-white/[0.06] dark:text-zinc-300">
          <span className="truncate">
            {item.category?.name ?? "未分类"}
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          {formatAdminNumber(item.commentCount)}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5">
          <Heart className="h-3.5 w-3.5" />
          {formatAdminNumber(item.likeCount)}
        </span>
        <span className="min-w-0 truncate whitespace-nowrap">
          {formatRelativeAdminTime(item.publishedAt, "未发布")}
        </span>
        <div className="shrink-0">
          <TableStatus status={item.status} />
        </div>
      </div>
    </div>
  );
}

function AdminUpdateMobileRow({
  item,
}: {
  item: Awaited<ReturnType<typeof listUpdatesForAdmin>>[number];
}) {
  const primaryText = getContentText(item.contentHtml, item.content) || item.title;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <div className="min-w-0 w-full">
        <div className="overflow-hidden">
          <Link
            href={`/admin/updates/${encodeURIComponent(item.id)}`}
            className="block w-full truncate text-[15px] font-medium leading-6 text-zinc-900 dark:text-zinc-50"
          >
            {primaryText}
          </Link>
        </div>
      </div>
      <div className="flex shrink-0 items-center pl-1 text-zinc-400 dark:text-zinc-500">
        <UpdateActionMenu
          isPublished={item.status === ContentStatus.PUBLISHED}
          updateId={item.id}
          editHref={`/admin/updates/${encodeURIComponent(item.id)}`}
          compact
        />
      </div>
      <div className="col-span-2 mt-1 flex items-center justify-between gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="min-w-0 truncate whitespace-nowrap">
          {formatRelativeAdminTime(item.publishedAt ?? item.createdAt)}
        </span>
        <div className="shrink-0">
          <TableStatus status={item.status} />
        </div>
      </div>
    </div>
  );
}

function AdminStandalonePageMobileRow({
  item,
}: {
  item: Awaited<ReturnType<typeof listStandalonePagesForAdmin>>[number];
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <div className="min-w-0 w-full">
        <div className="overflow-hidden">
          <Link
            href={`/admin/pages/${encodeURIComponent(item.id)}`}
            className="block w-full truncate text-[15px] font-medium leading-6 text-zinc-900 dark:text-zinc-50"
          >
            {item.title}
          </Link>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 pl-1 text-zinc-400 dark:text-zinc-500">
        <StandalonePageActionMenu
          standalonePageId={item.id}
          isPublished={item.status === ContentStatus.PUBLISHED}
          editHref={`/admin/pages/${encodeURIComponent(item.id)}`}
          compact
        />
      </div>
      <div className="col-span-2 mt-1 flex items-center justify-between gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="min-w-0 truncate whitespace-nowrap">
          {item.showInNav
            ? `${item.navGroup === StandalonePageNavGroup.HOME ? "起点" : "更多"} · ${item.navLabel ?? item.title}`
            : "不显示在导航中"}
        </span>
        <div className="shrink-0">
          <TableStatus status={item.status} />
        </div>
      </div>
    </div>
  );
}

function renderCompactRow(
  columns: Array<{ key: string; label: string }>,
  row: React.JSX.Element,
) {
  const children: React.ReactNode[] = Array.isArray(row.props.children)
    ? row.props.children
    : [row.props.children];

  return children.map((child: React.ReactNode, index: number) => (
    <div key={`${columns[index]?.key ?? index}`} className="grid gap-1">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
        {columns[index]?.label ?? ""}
      </p>
      <div>{child}</div>
    </div>
  ));
}

function TableMetric({ value }: { value: string }) {
  return <div className="text-right text-sm text-zinc-700 dark:text-zinc-200">{value}</div>;
}

function TableDate({ value, emptyText = "—" }: { value: string | null; emptyText?: string }) {
  return (
    <div className="w-full text-right text-sm text-zinc-500 dark:text-zinc-400">
      {formatRelativeAdminTime(value, emptyText)}
    </div>
  );
}

function TableStatus({ status }: { status: ContentStatus }) {
  const label =
    status === ContentStatus.PUBLISHED
      ? "已发布"
      : status === ContentStatus.ARCHIVED
        ? "回收站"
        : "草稿";
  const className =
    status === ContentStatus.PUBLISHED
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/15"
      : status === ContentStatus.ARCHIVED
        ? "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-white/[0.06] dark:text-zinc-300 dark:ring-white/10"
        : "bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/15";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function buildAdminListHref(
  basePath: string,
  field: AdminSortField,
  currentSort: AdminSortValue,
  query: string,
) {
  const activeSort = getAdminSortMeta(currentSort);
  const searchParams = new URLSearchParams();
  const nextDirection: AdminSortDirection =
    activeSort.field === field ? (activeSort.direction === "desc" ? "asc" : "desc") : "desc";
  searchParams.set("sort", `${field}-${nextDirection}`);

  if (query) {
    searchParams.set("q", query);
  }

  return `${basePath}?${searchParams.toString()}`;
}

function getAdminSortMeta(sort: AdminSortValue) {
  const [field, direction] = sort.split("-") as [AdminSortField, AdminSortDirection];

  return {
    field,
    direction,
  };
}

function formatRelativeAdminTime(value: string | null, emptyText = "—") {
  if (!value) {
    return emptyText;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const formatter = new Intl.RelativeTimeFormat("zh-CN", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffDays) < 30) {
    return formatter.format(diffDays, "day");
  }

  const diffMonths = Math.round(diffDays / 30);

  if (Math.abs(diffMonths) < 12) {
    return formatter.format(diffMonths, "month");
  }

  return formatter.format(Math.round(diffMonths / 12), "year");
}

function getTableWordCount(contentHtml: string | null, content: unknown) {
  return countTextUnits(getContentText(contentHtml, content));
}

function compareDates(left?: string | null, right?: string | null) {
  const leftTime = left ? new Date(left).getTime() : 0;
  const rightTime = right ? new Date(right).getTime() : 0;

  return leftTime - rightTime;
}

function getTagCloudItems(
  tags: Awaited<ReturnType<typeof listTags>>,
  posts: Awaited<ReturnType<typeof listPostsForAdmin>>,
) {
  const items = new Map<
    string,
    {
      id: string;
      name: string;
      slug: string;
      postCount: number;
      contentCount: number;
    }
  >();

  for (const tag of tags) {
    items.set(tag.id, {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      postCount: 0,
      contentCount: 0,
    });
  }

  for (const post of posts) {
    for (const tag of post.tags) {
      const current = items.get(tag.id) ?? {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        postCount: 0,
        contentCount: 0,
      };

      current.postCount += 1;
      current.contentCount += 1;
      items.set(tag.id, current);
    }
  }

  return Array.from(items.values()).sort((left, right) => left.name.localeCompare(right.name));
}

function countTextUnits(value: string) {
  const hanCharacters = value.match(/[\u3400-\u9fff\uf900-\ufaff]/g)?.length ?? 0;
  const nonHanText = value.replace(/[\u3400-\u9fff\uf900-\ufaff]/g, " ");
  const latinWords = nonHanText.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g)?.length ?? 0;

  return hanCharacters + latinWords;
}
