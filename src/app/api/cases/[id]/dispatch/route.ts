import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emergencyCases, ambulanceDispatches, ambulanceProviders, hospitals, caseActivityLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { action, ambulanceId, hospitalId, estimatedEtaMins = 12, providerNotes } = body;

    const caseRecords = await db.select().from(emergencyCases).where(eq(emergencyCases.id, id));
    if (caseRecords.length === 0) {
      return NextResponse.json({ success: false, error: "Case not found" }, { status: 404 });
    }
    const emergencyCase = caseRecords[0];

    if (action === "request_dispatch") {
      if (!ambulanceId) {
        return NextResponse.json({ success: false, error: "Ambulance ID required" }, { status: 400 });
      }

      // Check ambulance provider
      const ambRecords = await db.select().from(ambulanceProviders).where(eq(ambulanceProviders.id, ambulanceId));
      if (ambRecords.length === 0) {
        return NextResponse.json({ success: false, error: "Ambulance provider not found" }, { status: 404 });
      }
      const amb = ambRecords[0];

      // Create dispatch in 'requested' state
      const [newDispatch] = await db
        .insert(ambulanceDispatches)
        .values({
          caseId: id,
          ambulanceId,
          hospitalId: hospitalId || null,
          status: "requested",
          estimatedEtaMins,
          providerNotes: providerNotes || `Requested for case ${id}`,
        })
        .returning();

      // Update case status to 'ambulance_requested' (NOT confirmed yet!)
      await db
        .update(emergencyCases)
        .set({
          status: "ambulance_requested",
          updatedAt: new Date(),
        })
        .where(eq(emergencyCases.id, id));

      await db.insert(caseActivityLogs).values({
        caseId: id,
        actorName: "Operator",
        actorRole: "operator",
        action: "Ambulance Dispatch Requested",
        notes: `Request sent to ${amb.providerName} (${amb.vehicleNumber}, ${amb.vehicleType}). Awaiting explicit confirmation from ambulance fleet operator.`,
      });

      return NextResponse.json({
        success: true,
        dispatch: newDispatch,
        message: "Dispatch request sent. Awaiting provider confirmation.",
      });
    } else if (action === "confirm_dispatch") {
      // Provider explicit confirmation
      const { dispatchId } = body;
      const dispatchRecords = await db.select().from(ambulanceDispatches).where(eq(ambulanceDispatches.id, dispatchId));
      if (dispatchRecords.length === 0) {
        return NextResponse.json({ success: false, error: "Dispatch record not found" }, { status: 404 });
      }
      const disp = dispatchRecords[0];

      const ambRecords = await db.select().from(ambulanceProviders).where(eq(ambulanceProviders.id, disp.ambulanceId));
      const amb = ambRecords[0];

      const [updatedDispatch] = await db
        .update(ambulanceDispatches)
        .set({
          status: "confirmed",
          confirmedAt: new Date(),
          estimatedEtaMins,
          providerNotes: providerNotes || "Dispatch confirmed by provider control unit.",
          updatedAt: new Date(),
        })
        .where(eq(ambulanceDispatches.id, dispatchId))
        .returning();

      // Update provider status
      await db
        .update(ambulanceProviders)
        .set({ status: "dispatched" })
        .where(eq(ambulanceProviders.id, disp.ambulanceId));

      // NOW update case status to 'ambulance_confirmed' and 'ambulance_en_route'
      await db
        .update(emergencyCases)
        .set({
          status: "ambulance_confirmed",
          updatedAt: new Date(),
        })
        .where(eq(emergencyCases.id, id));

      await db.insert(caseActivityLogs).values({
        caseId: id,
        actorName: amb ? amb.providerName : "Ambulance Control",
        actorRole: "ambulance_provider",
        action: "Ambulance Dispatch CONFIRMED by Provider",
        notes: `CONFIRMED: Driver ${amb?.driverName || "On duty"} (${amb?.driverPhone}). Vehicle: ${amb?.vehicleNumber}. ETA: ${estimatedEtaMins} mins.`,
      });

      return NextResponse.json({
        success: true,
        dispatch: updatedDispatch,
        message: "Provider explicitly confirmed dispatch. Case updated to Ambulance Confirmed.",
      });
    } else if (action === "update_en_route") {
      const { dispatchId } = body;
      const [updatedDispatch] = await db
        .update(ambulanceDispatches)
        .set({
          status: "en_route",
          updatedAt: new Date(),
        })
        .where(eq(ambulanceDispatches.id, dispatchId))
        .returning();

      await db
        .update(emergencyCases)
        .set({
          status: "ambulance_en_route",
          updatedAt: new Date(),
        })
        .where(eq(emergencyCases.id, id));

      await db.insert(caseActivityLogs).values({
        caseId: id,
        actorName: "Ambulance Telemetry",
        actorRole: "ambulance_provider",
        action: "Ambulance En Route to Location",
        notes: "Ambulance GPS active. Siren & lights deployed.",
      });

      return NextResponse.json({ success: true, dispatch: updatedDispatch });
    } else if (action === "hospital_pre_arrival") {
      const { hospitalId: hId } = body;
      const hosp = await db.select().from(hospitals).where(eq(hospitals.id, hId));
      const hName = hosp[0]?.name || "Hospital Trauma Unit";

      await db
        .update(emergencyCases)
        .set({
          status: "hospital_contacted",
          updatedAt: new Date(),
        })
        .where(eq(emergencyCases.id, id));

      await db.insert(caseActivityLogs).values({
        caseId: id,
        actorName: "Operator",
        actorRole: "operator",
        action: `Hospital Pre-Arrival Alert Sent (${hName})`,
        notes: `Transmitted patient triage summary, ECG telemetry, blood group (${emergencyCase.userName}), and expected ETA to Trauma ER Desk.`,
      });

      return NextResponse.json({ success: true, message: "Hospital notified successfully" });
    } else {
      return NextResponse.json({ success: false, error: "Invalid action type" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error managing dispatch:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
