
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emergencyCases, caseActivityLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { type, photoUrl, voiceNoteUrl, voiceNoteDuration, lat, lng, accuracy } = body;

    const caseRecords = await db.select().from(emergencyCases).where(eq(emergencyCases.id, id));
    if (caseRecords.length === 0) {
      return NextResponse.json({ success: false, error: "Case not found" }, { status: 404 });
    }

    const currentCase = caseRecords[0];

    if (type === "photo" && photoUrl) {
      const existingPhotos = currentCase.photos || [];
      const newPhotoObj = {
        url: photoUrl,
        timestamp: new Date().toISOString(),
        lat: lat ?? currentCase.latitude,
        lng: lng ?? currentCase.longitude,
        accuracy: accuracy ?? (currentCase.locationAccuracy || 5.0),
        status: "Uploaded & Geotagged",
      };

      const updatedPhotos = [...existingPhotos, newPhotoObj];

      await db
        .update(emergencyCases)
        .set({
          photos: updatedPhotos,
          updatedAt: new Date(),
        })
        .where(eq(emergencyCases.id, id));

      await db.insert(caseActivityLogs).values({
        caseId: id,
        actorName: `${currentCase.userName} (Device Camera)`,
        actorRole: "user",
        action: "Geotagged Emergency Photo Uploaded",
        notes: `Image captured at GPS (${newPhotoObj.lat.toFixed(4)}, ${newPhotoObj.lng.toFixed(4)}). Accuracy: ${newPhotoObj.accuracy}m.`,
      });

      return NextResponse.json({ success: true, photos: updatedPhotos });
    } else if (type === "voice_note" && voiceNoteUrl) {
      await db
        .update(emergencyCases)
        .set({
          voiceNoteUrl,
          voiceNoteDuration: voiceNoteDuration || 15,
          updatedAt: new Date(),
        })
        .where(eq(emergencyCases.id, id));

      await db.insert(caseActivityLogs).values({
        caseId: id,
        actorName: `${currentCase.userName} (Device Mic)`,
        actorRole: "user",
        action: "15-Second Emergency Voice Note Captured",
        notes: `Audio duration: ${voiceNoteDuration || 15} seconds. Uploaded to secure encrypted storage link.`,
      });

      return NextResponse.json({ success: true, voiceNoteUrl });
    } else {
      return NextResponse.json({ success: false, error: "Invalid media payload" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error attaching media:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
