import { NextResponse } from "next/server";
import { buildStoQrDestination } from "@/lib/events/event-web";

export const runtime = "nodejs";

export function GET(request: Request) {
  return NextResponse.redirect(buildStoQrDestination(new URL(request.url)), 307);
}
