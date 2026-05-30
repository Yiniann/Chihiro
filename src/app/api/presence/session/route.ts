import { NextResponse } from "next/server";
import { getOrCreateVisitorId } from "@/server/visitor";

export async function GET() {
  const response = NextResponse.json(
    {},
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
  const visitorId = await getOrCreateVisitorId(response);

  return NextResponse.json(
    {
      visitorId,
    },
    {
      headers: response.headers,
    },
  );
}
