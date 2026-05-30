import { NextResponse } from "next/server";
import { getSitePresenceSummary } from "@/server/presence";

export async function GET() {
  const summary = await getSitePresenceSummary();

  return NextResponse.json(summary, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
