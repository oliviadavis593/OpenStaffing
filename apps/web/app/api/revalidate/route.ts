import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Called by the ingest workflow after new data lands:
 *   curl -X POST "$SITE_URL/api/revalidate" -H "x-revalidate-secret: $REVALIDATE_SECRET"
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, revalidatedAt: new Date().toISOString() });
}
