
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emergencyCases, locationHistory, caseActivityLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      latitude,
      longitude,
      accuracy = 5.0,
      altitude,
      speed,
      locationName,
      batteryLevel,
      networkStatus,
    } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ success: false, error: "Missing latitude or longitude" }, { status: 400 });
    }

    // Insert into location history
    const [newLoc] = await db
      .insert(locationHistory)
      .values({
        caseId: id,
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        timestamp: new Date(),
      })
      .returning();

    // Update emergency case current location & metadata
    const caseUpdates: any = {
      latitude,
      longitude,
      locationAccuracy: accuracy,
      updatedAt: new Date(),
    };
    if (locationName) caseUpdates.locationName = locationName;
    if (batteryLevel !== undefined) caseUpdates.batteryLevel = batteryLevel;
    if (networkStatus) caseUpdates.networkStatus = networkStatus;

    const [updatedCase] = await db
      .update(emergencyCases)
      .set(caseUpdates)
      .where(eq(emergencyCases.id, id))
      .returning();

    return NextResponse.json({ success: true, location: newLoc, case: updatedCase });
  } catch (error: any) {
    console.error("Error updating case location:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
