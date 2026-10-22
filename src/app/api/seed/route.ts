import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, emergencyContacts, emergencyCases, hospitals, ambulanceProviders, caseActivityLogs, locationHistory } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // Check if hospitals already seeded
    const existingHospitals = await db.select().from(hospitals).limit(1);
    
    if (existingHospitals.length === 0) {
      // Seed Hospitals in India (Delhi, Bengaluru, Mumbai)
      await db.insert(hospitals).values([
        {
          name: "All India Institute of Medical Sciences (AIIMS)",
          city: "New Delhi",
          state: "Delhi",
          latitude: 28.5672,
          longitude: 77.2100,
          phone: "+91-11-26588500",
          emergencyDepartmentStatus: "active",
          bedCapacity: 120,
          traumaLevel: "Level 1 Apex Trauma",
          address: "Sri Aurobindo Marg, Ansari Nagar, New Delhi - 110029",
        },
        {
          name: "Fortis Escorts Heart Institute",
          city: "New Delhi",
          state: "Delhi",
          latitude: 28.5601,
          longitude: 77.2750,
          phone: "+91-11-47135000",
          emergencyDepartmentStatus: "active",
          bedCapacity: 85,
          traumaLevel: "Level 1 Cardiac Center",
          address: "Okhla Road, Opp Holy Family Hospital, New Delhi - 110025",
        },
        {
          name: "Apollo Hospital Bannerghatta",
          city: "Bengaluru",
          state: "Karnataka",
          latitude: 12.8945,
          longitude: 77.5989,
          phone: "+91-80-26304050",
          emergencyDepartmentStatus: "active",
          bedCapacity: 95,
          traumaLevel: "Level 1 Trauma",
          address: "154/11, Opp. IIMB, Bannerghatta Road, Bengaluru - 560076",
        },
        {
          name: "Manipal Hospital Old Airport Road",
          city: "Bengaluru",
          state: "Karnataka",
          latitude: 12.9585,
          longitude: 77.6483,
          phone: "+91-80-25024444",
          emergencyDepartmentStatus: "active",
          bedCapacity: 110,
          traumaLevel: "Level 1 Emergency Care",
          address: "98, HAL Old Airport Rd, Kodihalli, Bengaluru - 560017",
        },
        {
          name: "Lilavati Hospital & Research Centre",
          city: "Mumbai",
          state: "Maharashtra",
          latitude: 19.0512,
          longitude: 72.8285,
          phone: "+91-22-26751000",
          emergencyDepartmentStatus: "busy",
          bedCapacity: 70,
          traumaLevel: "Level 1 Trauma",
          address: "A-791, Bandra Reclamation, Bandra West, Mumbai - 400050",
        },
      ]);

      // Seed Ambulance Providers
      await db.insert(ambulanceProviders).values([
        {
          providerName: "CATS 108 Emergency Ambulance Service",
          vehicleNumber: "DL-01-EA-9912",
          driverName: "Rajesh Kumar",
          driverPhone: "+91-9876543210",
          vehicleType: "ALS",
          baseLatitude: 28.5650,
          baseLongitude: 77.2150,
          currentLatitude: 28.5665,
          currentLongitude: 77.2140,
          status: "available",
        },
        {
          providerName: "Fortis Critical Care Transport Unit #4",
          vehicleNumber: "DL-03-CC-4011",
          driverName: "Vikram Singh",
          driverPhone: "+91-9811223344",
          vehicleType: "Cardiac Care",
          baseLatitude: 28.5580,
          baseLongitude: 77.2710,
          currentLatitude: 28.5590,
          currentLongitude: 77.2720,
          status: "available",
        },
        {
          providerName: "108 Karnataka Emergency Response Unit #12",
          vehicleNumber: "KA-01-EM-1088",
          driverName: "Siddharth Gowda",
          driverPhone: "+91-9744112233",
          vehicleType: "ALS",
          baseLatitude: 12.8910,
          baseLongitude: 77.5950,
          currentLatitude: 12.8930,
          currentLongitude: 77.5970,
          status: "available",
        },
        {
          providerName: "Manipal Rapid Life Support Unit #7",
          vehicleNumber: "KA-03-RL-7090",
          driverName: "Anand Rao",
          driverPhone: "+91-9900887766",
          vehicleType: "BLS",
          baseLatitude: 12.9550,
          baseLongitude: 77.6450,
          currentLatitude: 12.9570,
          currentLongitude: 77.6470,
          status: "available",
        },
      ]);

      // Seed Default Demo User Profile
      await db.insert(users).values({
        userId: "USR-DEMO-8821",
        fullName: "Aarav Sharma",
        phone: "+91-9810012345",
        email: "aarav.sharma@example.com",
        bloodGroup: "O+",
        age: 42,
        gender: "Male",
        medicalConditions: "Hypertension, History of Arrhythmia",
        allergies: "Penicillin, Shellfish",
        currentMedications: "Amlodipine 5mg OD, Aspirin 75mg OD",
        accessibilityNeeds: "Requires clear verbal instructions; Mild hearing impairment in left ear",
        primaryLanguage: "English / Hindi",
        consentGiven: true,
        preferredHospital: "AIIMS New Delhi",
      });

      // Seed Primary Emergency Contacts
      await db.insert(emergencyContacts).values([
        {
          userId: "USR-DEMO-8821",
          contactName: "Priya Sharma",
          relationship: "Spouse",
          phoneNumber: "+91-9810098765",
          isPrimary: true,
          notifySms: true,
          notifyCall: true,
        },
        {
          userId: "USR-DEMO-8821",
          contactName: "Dr. Ramesh Verma",
          relationship: "Personal Physician",
          phoneNumber: "+91-9811122233",
          isPrimary: false,
          notifySms: true,
          notifyCall: false,
        },
      ]);

      // Seed Initial Active Case
      const caseId1 = "RCRT-2026-9812";
      await db.insert(emergencyCases).values({
        id: caseId1,
        userId: "USR-DEMO-8821",
        userName: "Aarav Sharma",
        userPhone: "+91-9810012345",
        triggerType: "power_button",
        status: "assistance_required",
        priority: "critical",
        latitude: 28.5685,
        longitude: 77.2132,
        locationAccuracy: 4.8,
        locationName: "Near Gate 2, AIIMS Campus, Ring Road, New Delhi",
        batteryLevel: 68,
        networkStatus: "5G Active (Strong Signal)",
        heartRate: 124,
        symptomsReported: "Acute chest pain, shortness of breath, sudden sweating",
        voiceNoteUrl: "/audio/sample_voice_note.mp3",
        voiceNoteDuration: 15,
        photos: [
          {
            url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",
            timestamp: new Date().toISOString(),
            lat: 28.5685,
            lng: 77.2132,
            accuracy: 4.8,
            status: "Uploaded & Geotagged",
          }
        ],
        assignedOperatorName: "Operator #104 (RCRT Central Command)",
      });

      // Seed location history for caseId1
      await db.insert(locationHistory).values([
        {
          caseId: caseId1,
          latitude: 28.5680,
          longitude: 77.2120,
          accuracy: 12.0,
          speed: 1.2,
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
        },
        {
          caseId: caseId1,
          latitude: 28.5685,
          longitude: 77.2132,
          accuracy: 4.8,
          speed: 0.0,
          timestamp: new Date(),
        },
      ]);

      // Seed Case Logs
      await db.insert(caseActivityLogs).values([
        {
          caseId: caseId1,
          actorName: "Aarav Sharma (Device)",
          actorRole: "user",
          action: "SOS Activated (Triple-Press Power Button)",
          notes: "Countdown elapsed (10s). High urgency panic flag raised.",
        },
        {
          caseId: caseId1,
          actorName: "System Dispatcher",
          actorRole: "system",
          action: "Emergency Alerts Sent",
          notes: "SMS & Automated Voice alerts triggered for primary contact Priya Sharma (+91-9810098765)",
        },
        {
          caseId: caseId1,
          actorName: "Operator #104",
          actorRole: "operator",
          action: "Operator Reviewing Case",
          notes: "Heart rate elevate (124 BPM). Geotagged photo shows roadside bench near AIIMS.",
        },
      ]);
    }

    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
