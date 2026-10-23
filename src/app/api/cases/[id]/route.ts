
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emergencyCases, caseActivityLogs, locationHistory, users, emergencyContacts, ambulanceDispatches, ambulanceProviders, hospitals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const caseRecords = await db.select().from(emergencyCases).where(eq(emergencyCases.id, id));
    if (caseRecords.length === 0) {
      return NextResponse.json({ success: false, error: "Case not found" }, { status: 404 });
    }

    const emergencyCase = caseRecords[0];

    // Fetch user profile and contacts
    const userRecords = await db.select().from(users).where(eq(users.userId, emergencyCase.userId));
    const userProfile = userRecords[0] || null;

    const contacts = await db
      .select()
      .from(emergencyContacts)
      .where(eq(emergencyContacts.userId, emergencyCase.userId));

    // Fetch location history
    const locHistory = await db
      .select()
      .from(locationHistory)
      .where(eq(locationHistory.caseId, id))
      .orderBy(desc(locationHistory.timestamp));

    // Fetch activity logs
    const activityLogs = await db
      .select()
      .from(caseActivityLogs)
      .where(eq(caseActivityLogs.caseId, id))
      .orderBy(desc(caseActivityLogs.timestamp));

    // Fetch ambulance dispatches for this case
    const dispatches = await db
      .select()
      .from(ambulanceDispatches)
      .where(eq(ambulanceDispatches.caseId, id))
      .orderBy(desc(ambulanceDispatches.createdAt));

    // Enrich dispatches with ambulance provider & hospital details
    const enrichedDispatches = await Promise.all(
      dispatches.map(async (d) => {
        const amb = await db.select().from(ambulanceProviders).where(eq(ambulanceProviders.id, d.ambulanceId));
        let hosp = null;
        if (d.hospitalId) {
          const h = await db.select().from(hospitals).where(eq(hospitals.id, d.hospitalId));
          hosp = h[0] || null;
        }
        return {
          ...d,
          ambulance: amb[0] || null,
          hospital: hosp,
        };
      })
    );

    return NextResponse.json({
      success: true,
      case: emergencyCase,
      userProfile,
      contacts,
      locationHistory: locHistory,
      activityLogs,
      dispatches: enrichedDispatches,
    });
  } catch (error: any) {
    console.error("Error fetching single case:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      status,
      priority,
      assignedOperatorName,
      cancellationReason,
      symptomsReported,
      notes,
      actorName = "Operator",
      actorRole = "operator",
    } = body;

    const caseRecords = await db.select().from(emergencyCases).where(eq(emergencyCases.id, id));
    if (caseRecords.length === 0) {
      return NextResponse.json({ success: false, error: "Case not found" }, { status: 404 });
    }

    const updates: any = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assignedOperatorName !== undefined) updates.assignedOperatorName = assignedOperatorName;
    if (cancellationReason !== undefined) updates.cancellationReason = cancellationReason;
    if (symptomsReported !== undefined) updates.symptomsReported = symptomsReported;

    const [updatedCase] = await db
      .update(emergencyCases)
      .set(updates)
      .where(eq(emergencyCases.id, id))
      .returning();

    // Log the change
    let actionText = "Case Updated";
    if (status) actionText = `Case Status changed to: ${status.replace(/_/g, " ").toUpperCase()}`;
    if (cancellationReason) actionText = `Emergency Cancelled / False Alarm`;

    await db.insert(caseActivityLogs).values({
      caseId: id,
      actorName,
      actorRole,
      action: actionText,
      notes: notes || (cancellationReason ? `Reason: ${cancellationReason}` : `Updated parameters: ${Object.keys(updates).join(", ")}`),
    });

    return NextResponse.json({ success: true, case: updatedCase });
  } catch (error: any) {
    console.error("Error updating case:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
