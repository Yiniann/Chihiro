import { NextResponse } from "next/server";
import { likeSite, getSiteLikeState } from "@/server/repositories/site-likes";
import { getOrCreateVisitorId } from "@/server/visitor";

export async function GET() {
  const response = NextResponse.json({});
  const visitorId = await getOrCreateVisitorId(response);
  const state = await getSiteLikeState(visitorId);

  return NextResponse.json(state, {
    headers: response.headers,
  });
}

export async function POST() {
  const response = NextResponse.json({});
  const visitorId = await getOrCreateVisitorId(response);
  const state = await likeSite(visitorId);

  return NextResponse.json(state, {
    headers: response.headers,
  });
}
