
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { db } from "@/db";
import { hospitals } from "@/db/schema";

export async function GET() {
  try {
    const list = await db.select().from(hospitals);
    return NextResponse.json({ success: true, count: list.length, hospitals: list });
  } catch (error: any) {
    console.error("Error fetching hospitals:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
