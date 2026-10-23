
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, emergencyContacts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "USR-DEMO-8821";

    const userList = await db.select().from(users).where(eq(users.userId, userId));
    const user = userList[0] || null;

    const contacts = await db
      .select()
      .from(emergencyContacts)
      .where(eq(emergencyContacts.userId, userId));

    return NextResponse.json({ success: true, user, contacts });
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId = "USR-DEMO-8821", profileData, contacts } = body;

    if (profileData) {
      const existing = await db.select().from(users).where(eq(users.userId, userId));
      if (existing.length > 0) {
        await db
          .update(users)
          .set({
            ...profileData,
            updatedAt: new Date(),
          })
          .where(eq(users.userId, userId));
      } else {
        await db.insert(users).values({
          userId,
          fullName: profileData.fullName || "Aarav Sharma",
          phone: profileData.phone || "+91-9810012345",
          ...profileData,
        });
      }
    }

    if (contacts && Array.isArray(contacts)) {
      // Refresh contacts
      await db.delete(emergencyContacts).where(eq(emergencyContacts.userId, userId));
      for (const c of contacts) {
        await db.insert(emergencyContacts).values({
          userId,
          contactName: c.contactName,
          relationship: c.relationship,
          phoneNumber: c.phoneNumber,
          isPrimary: c.isPrimary ?? false,
          notifySms: c.notifySms ?? true,
          notifyCall: c.notifyCall ?? true,
        });
      }
    }

    const updatedUser = await db.select().from(users).where(eq(users.userId, userId));
    const updatedContacts = await db
      .select()
      .from(emergencyContacts)
      .where(eq(emergencyContacts.userId, userId));

    return NextResponse.json({ success: true, user: updatedUser[0], contacts: updatedContacts });
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
