import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/server/auth";
import { resolveImageUrlPhotoMeta } from "@/server/object-storage";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "请先登录后台。" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url")?.trim();

  if (!url) {
    return NextResponse.json({ error: "缺少图片 URL。" }, { status: 400 });
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return NextResponse.json({ error: "只支持 http 或 https 图片地址。" }, { status: 400 });
    }

    const meta = await resolveImageUrlPhotoMeta(parsedUrl.toString());

    return NextResponse.json({ meta: meta ?? null });
  } catch {
    return NextResponse.json({ error: "图片 URL 无效。" }, { status: 400 });
  }
}
