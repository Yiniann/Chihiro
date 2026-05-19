import { ContentStatus, Prisma, StandalonePageNavGroup } from "@prisma/client";
import { prisma } from "@/server/db/client";

type StandalonePageRecord = NonNullable<
  Awaited<ReturnType<typeof prisma.standalonePage.findUnique>>
>;

export type StandalonePageItem = {
  id: number;
  title: string;
  slug: string;
  status: ContentStatus;
  content: Prisma.JsonValue | null;
  contentHtml: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  draftSnapshot: DraftStandalonePageSnapshot | null;
  showInNav: boolean;
  navLabel: string | null;
  navEyebrow: string | null;
  navGroup: StandalonePageNavGroup;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type StandalonePageNavigationItem = {
  id: number;
  slug: string;
  href: string;
  title: string;
  navLabel: string;
  navEyebrow: string | null;
  navGroup: StandalonePageNavGroup;
};

type PublishedStandalonePageSnapshot = {
  title: string;
  slug: string;
  content: Prisma.JsonValue | null;
  contentHtml: string | null;
  publishedAt: string | null;
  showInNav: boolean;
  navLabel: string | null;
  navEyebrow: string | null;
  navGroup: StandalonePageNavGroup;
  seoTitle: string | null;
  seoDescription: string | null;
};

type DraftStandalonePageSnapshot = PublishedStandalonePageSnapshot & {
  savedAt: string;
};

export type SaveStandalonePageInput = {
  id?: number;
  title: string;
  slug: string;
  content: Prisma.JsonValue | null;
  contentHtml: string | null;
  status: ContentStatus;
  publishedAt: Date | null;
  showInNav: boolean;
  navLabel: string | null;
  navEyebrow: string | null;
  navGroup: StandalonePageNavGroup;
  seoTitle: string | null;
  seoDescription: string | null;
};

export async function listStandalonePagesForAdmin(): Promise<StandalonePageItem[]> {
  const items = await prisma.standalonePage.findMany({
    orderBy: [{ updatedAt: Prisma.SortOrder.desc }, { createdAt: Prisma.SortOrder.desc }],
  });

  return items.map(mapStandalonePageRecord);
}

export async function getStandalonePageByIdForAdmin(id: number): Promise<StandalonePageItem | null> {
  const page = await prisma.standalonePage.findUnique({
    where: { id },
  });

  return page ? mapStandalonePageRecord(page) : null;
}

export async function listPublishedStandalonePages(): Promise<StandalonePageItem[]> {
  const items = await prisma.standalonePage.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
    },
    orderBy: [{ publishedAt: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.asc }],
  });

  return items.map(mapStandalonePageRecord);
}

export async function getPublishedStandalonePageBySlug(
  slug: string,
): Promise<StandalonePageItem | null> {
  const page = await prisma.standalonePage.findFirst({
    where: {
      slug,
      status: ContentStatus.PUBLISHED,
    },
  });

  return page ? mapStandalonePageRecord(page) : null;
}

export async function listPublishedStandalonePagesForNavigation(
  navGroup: StandalonePageNavGroup,
): Promise<StandalonePageNavigationItem[]> {
  const items = await prisma.standalonePage.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      showInNav: true,
      navGroup,
    },
    orderBy: [{ publishedAt: Prisma.SortOrder.asc }, { createdAt: Prisma.SortOrder.asc }],
  });

  return items.map((item) => ({
    id: item.id,
    slug: item.slug,
    href: `/${item.slug}`,
    title: item.title,
    navLabel: item.navLabel?.trim() || item.title,
    navEyebrow: item.navEyebrow?.trim() || null,
    navGroup: item.navGroup,
  }));
}

export async function saveStandalonePage(input: SaveStandalonePageInput): Promise<StandalonePageItem> {
  const current =
    typeof input.id === "number"
      ? await prisma.standalonePage.findUnique({
          where: { id: input.id },
        })
      : null;

  if (current && (current.status === ContentStatus.PUBLISHED || current.draftSnapshot)) {
    const draftSnapshot = buildDraftSnapshot({
      title: input.title,
      slug: input.slug,
      content: input.content,
      contentHtml: input.contentHtml,
      publishedAt: input.publishedAt,
      showInNav: input.showInNav,
      navLabel: input.navLabel,
      navEyebrow: input.navEyebrow,
      navGroup: input.navGroup,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
    });

    const page = await prisma.standalonePage.update({
      where: { id: input.id },
      data: {
        draftSnapshot,
      },
    });

    return mapStandalonePageRecord(page);
  }

  const baseData = {
    title: input.title,
    slug: input.slug,
    content: input.content ?? Prisma.DbNull,
    contentHtml: input.contentHtml,
    status: input.status,
    publishedAt: input.publishedAt,
    showInNav: input.showInNav,
    navLabel: input.navLabel,
    navEyebrow: input.navEyebrow,
    navGroup: input.navGroup,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
  };

  const page = current
    ? await prisma.standalonePage.update({
        where: { id: input.id },
        data: {
          ...baseData,
          draftSnapshot: Prisma.DbNull,
        },
      })
    : await prisma.standalonePage.create({
        data: baseData,
      });

  return mapStandalonePageRecord(page);
}

export async function publishStandalonePageById(id: number): Promise<StandalonePageItem> {
  const current = await prisma.standalonePage.findUnique({
    where: { id },
  });

  if (!current) {
    throw new Error(`Standalone page not found: ${id}`);
  }

  const draftSnapshot = parseDraftSnapshot(current.draftSnapshot);
  const publishedAt = current.publishedAt ?? new Date();
  const resolvedPublishedAt = draftSnapshot?.publishedAt ? new Date(draftSnapshot.publishedAt) : publishedAt;
  const page = await prisma.standalonePage.update({
    where: { id },
    data: {
      status: ContentStatus.PUBLISHED,
      title: draftSnapshot?.title ?? current.title,
      slug: draftSnapshot?.slug ?? current.slug,
      content: (draftSnapshot?.content ?? current.content) ?? Prisma.DbNull,
      contentHtml: draftSnapshot?.contentHtml ?? current.contentHtml,
      publishedAt: resolvedPublishedAt,
      showInNav: draftSnapshot?.showInNav ?? current.showInNav,
      navLabel: draftSnapshot?.navLabel ?? current.navLabel,
      navEyebrow: draftSnapshot?.navEyebrow ?? current.navEyebrow,
      navGroup: draftSnapshot?.navGroup ?? current.navGroup,
      seoTitle: draftSnapshot?.seoTitle ?? current.seoTitle,
      seoDescription: draftSnapshot?.seoDescription ?? current.seoDescription,
      draftSnapshot: Prisma.DbNull,
    },
  });

  return mapStandalonePageRecord(page);
}

export async function discardStandalonePageRevisionById(id: number): Promise<StandalonePageItem> {
  const page = await prisma.standalonePage.update({
    where: { id },
    data: {
      draftSnapshot: Prisma.DbNull,
    },
  });

  return mapStandalonePageRecord(page);
}

export async function deleteStandalonePageById(id: number): Promise<StandalonePageItem> {
  const page = await prisma.standalonePage.delete({
    where: { id },
  });

  return mapStandalonePageRecord(page);
}

export async function moveStandalonePageToTrashById(id: number): Promise<StandalonePageItem> {
  const page = await prisma.standalonePage.update({
    where: { id },
    data: {
      status: ContentStatus.ARCHIVED,
    },
  });

  return mapStandalonePageRecord(page);
}

export async function restoreStandalonePageFromTrashById(id: number): Promise<StandalonePageItem> {
  const page = await prisma.standalonePage.update({
    where: { id },
    data: {
      status: ContentStatus.DRAFT,
    },
  });

  return mapStandalonePageRecord(page);
}

export async function unpublishStandalonePageById(id: number): Promise<StandalonePageItem> {
  const page = await prisma.standalonePage.update({
    where: { id },
    data: {
      status: ContentStatus.DRAFT,
      publishedAt: null,
    },
  });

  return mapStandalonePageRecord(page);
}

export async function ensureDefaultStandalonePages() {
  const defaults = [
    {
      slug: "about",
      title: "关于此站点",
      navLabel: "此站点",
      navEyebrow: "About",
      navGroup: StandalonePageNavGroup.HOME,
      paragraphs: [
        "这里可以写站点的来历、写作方向，或者你想让第一次到访的人先读到的那段话。",
        "独立页面默认不会自动显示标题，前台会直接从正文开始展示，所以这一页适合写成更自由的说明页。",
      ],
    },
    {
      slug: "message",
      title: "留言",
      navLabel: "留言",
      navEyebrow: "Message",
      navGroup: StandalonePageNavGroup.HOME,
      paragraphs: [
        "这里可以放留言说明、联系偏好，或者一段你希望读者在写信前先看到的话。",
        "如果之后要接入联系表单、社交方式或来信规则，也可以继续在这一页扩展。",
      ],
    },
  ] as const;

  for (const item of defaults) {
    const content = buildParagraphContent(item.paragraphs);
    const contentHtml = item.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");

    await prisma.standalonePage.upsert({
      where: {
        slug: item.slug,
      },
      update: {},
      create: {
        title: item.title,
        slug: item.slug,
        status: ContentStatus.PUBLISHED,
        content,
        contentHtml,
        publishedAt: new Date(),
        showInNav: true,
        navLabel: item.navLabel,
        navEyebrow: item.navEyebrow,
        navGroup: item.navGroup,
        seoTitle: item.title,
        seoDescription: item.paragraphs[0],
      },
    });
  }
}

function mapStandalonePageRecord(page: StandalonePageRecord): StandalonePageItem {
  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    status: page.status,
    content: page.content,
    contentHtml: page.contentHtml,
    publishedAt: page.publishedAt?.toISOString() ?? null,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    draftSnapshot: parseDraftSnapshot(page.draftSnapshot),
    showInNav: page.showInNav,
    navLabel: page.navLabel,
    navEyebrow: page.navEyebrow,
    navGroup: page.navGroup,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
  };
}

function buildDraftSnapshot(
  input: Omit<PublishedStandalonePageSnapshot, "publishedAt"> & {
    publishedAt: Date | null;
  },
): DraftStandalonePageSnapshot {
  return {
    title: input.title,
    slug: input.slug,
    content: input.content,
    contentHtml: input.contentHtml,
    publishedAt: input.publishedAt?.toISOString() ?? null,
    showInNav: input.showInNav,
    navLabel: input.navLabel,
    navEyebrow: input.navEyebrow,
    navGroup: input.navGroup,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    savedAt: new Date().toISOString(),
  };
}

function parseDraftSnapshot(value: Prisma.JsonValue | null): DraftStandalonePageSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const snapshot = value as Partial<DraftStandalonePageSnapshot>;

  if (
    typeof snapshot.title !== "string" ||
    typeof snapshot.slug !== "string" ||
    typeof snapshot.savedAt !== "string"
  ) {
    return null;
  }

  return {
    title: snapshot.title,
    slug: snapshot.slug,
    content: snapshot.content ?? null,
    contentHtml: typeof snapshot.contentHtml === "string" ? snapshot.contentHtml : null,
    publishedAt: typeof snapshot.publishedAt === "string" ? snapshot.publishedAt : null,
    showInNav: Boolean(snapshot.showInNav),
    navLabel: typeof snapshot.navLabel === "string" ? snapshot.navLabel : null,
    navEyebrow: typeof snapshot.navEyebrow === "string" ? snapshot.navEyebrow : null,
    navGroup:
      snapshot.navGroup === StandalonePageNavGroup.MORE
        ? StandalonePageNavGroup.MORE
        : StandalonePageNavGroup.HOME,
    seoTitle: typeof snapshot.seoTitle === "string" ? snapshot.seoTitle : null,
    seoDescription:
      typeof snapshot.seoDescription === "string" ? snapshot.seoDescription : null,
    savedAt: snapshot.savedAt,
  };
}

function buildParagraphContent(paragraphs: readonly string[]): Prisma.JsonArray {
  return paragraphs.map((paragraph) => ({
    type: "paragraph",
    children: [{ text: paragraph }],
  })) as Prisma.JsonArray;
}
