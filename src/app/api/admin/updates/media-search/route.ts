import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/server/auth";
import { searchMovieCandidates, searchMusicCandidates } from "@/server/media-search";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "请先登录后台。" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ items: [] });
  }

  try {
    if (kind === "movie") {
      const items = await searchMovieCandidates(query);
      return NextResponse.json({ items });
    }

    if (kind === "music") {
      const items = await searchMusicCandidates(query);
      return NextResponse.json({ items });
    }

    return NextResponse.json({ error: "不支持的搜索类型。" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "搜索时出错了。",
      },
      { status: 400 },
    );
  }
}
