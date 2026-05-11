import { NextResponse } from "next/server";
import { recordPublishedPostView } from "@/server/repositories/posts";
import { getOrCreateVisitorId } from "@/server/visitor";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const postId = await getPostId(context);

  if (!postId) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  const response = NextResponse.json({});
  const visitorId = await getOrCreateVisitorId(response);
  const engagement = await recordPublishedPostView(postId, visitorId);

  if (!engagement) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  return NextResponse.json(engagement, {
    headers: response.headers,
  });
}

async function getPostId(context: RouteContext) {
  const { id } = await context.params;
  const postId = Number(id);
  return Number.isInteger(postId) && postId > 0 ? postId : null;
}
