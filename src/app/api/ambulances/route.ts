export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { db } from "@/db";
import { ambulanceProviders } from "@/db/schema";

export async function GET() {
  try {
    const list = await db.select().from(ambulanceProviders);
    return NextResponse.json({ success: true, count: list.length, ambulanceProviders: list });
  } catch (error: any) {
    console.error("Error fetching ambulance providers:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
