import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emergencyCases, caseActivityLogs, locationHistory, users, emergencyContacts } from "@/db/schema";
import { desc, eq, like, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const query = searchParams.get("q");

    let cases = await db.select().from(emergencyCases).orderBy(desc(emergencyCases.createdAt));

    if (status && status !== "all") {
      cases = cases.filter((c) => c.status === status);
    }
    if (priority && priority !== "all") {
      cases = cases.filter((c) => c.priority === priority);
    }
    if (query) {
      const qLower = query.toLowerCase();
      cases = cases.filter(
        (c) =>
          c.id.toLowerCase().includes(qLower) ||
          c.userName.toLowerCase().includes(qLower) ||
          c.userPhone.includes(qLower) ||
          (c.locationName && c.locationName.toLowerCase().includes(qLower))
      );
    }

    return NextResponse.json({ success: true, count: cases.length, cases });
  } catch (error: any) {
    console.error("Error fetching cases:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      userId = "USR-DEMO-8821",
      userName = "Aarav Sharma",
      userPhone = "+91-9810012345",
      triggerType = "in_app_button",
      latitude = 28.5672,
      longitude = 77.2100,
      locationAccuracy = 5.0,
      locationName = "New Delhi Central Area, India",
      batteryLevel = 90,
      networkStatus = "5G Active",
      heartRate = 110,
      symptomsReported = "Sudden emergency activation triggered by user.",
      priority = "high",
    } = body;

    // Generate case ID
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const caseId = `RCRT-${new Date().getFullYear()}-${randomDigits}`;

    // Create Emergency Case
    const [newCase] = await db
      .insert(emergencyCases)
      .values({
        id: caseId,
        userId,
        userName,
        userPhone,
        triggerType,
        status: "sos_received",
        priority,
        latitude,
        longitude,
        locationAccuracy,
        locationName,
        batteryLevel,
        networkStatus,
        heartRate,
        symptomsReported,
        assignedOperatorName: "Unassigned (Awaiting Review)",
      })
      .returning();

    // Log initial location history
    await db.insert(locationHistory).values({
      caseId,
      latitude,
      longitude,
      accuracy: locationAccuracy,
      speed: 0,
      timestamp: new Date(),
    });

    // Log initial activity
    const triggerLabelMap: Record<string, string> = {
      power_button: "Triple-Press Power Button Emergency Shortcut",
      in_app_button: "In-App Emergency SOS Button Press",
      smartwatch: "Smartwatch Emergency Action (Wear OS / Apple Watch)",
      fall_detection: "Automated Fall / Impact Detection Sensor",
    };

    const triggerDesc = triggerLabelMap[triggerType] || triggerType;

    await db.insert(caseActivityLogs).values([
      {
        caseId,
        actorName: `${userName} (Device)`,
        actorRole: "user",
        action: `Emergency Case Triggered (${triggerDesc})`,
        notes: `GPS Pin: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (Accuracy: ${locationAccuracy}m). Battery: ${batteryLevel}%.`,
      },
      {
        caseId,
        actorName: "RCRT Dispatch Network",
        actorRole: "system",
        action: "Emergency Alerts Broadcast",
        notes: "Alert dispatched to RCRT Operator Command & Emergency Contacts via SMS/Voice gateway queue.",
      },
    ]);

    return NextResponse.json({ success: true, case: newCase, caseId });
  } catch (error: any) {
    console.error("Error creating SOS case:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
