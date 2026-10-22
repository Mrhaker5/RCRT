import { pgTable, serial, text, varchar, timestamp, boolean, integer, doublePrecision, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  email: varchar("email", { length: 255 }),
  bloodGroup: varchar("blood_group", { length: 10 }),
  age: integer("age"),
  gender: varchar("gender", { length: 20 }),
  medicalConditions: text("medical_conditions"),
  allergies: text("allergies"),
  currentMedications: text("current_medications"),
  accessibilityNeeds: text("accessibility_needs"),
  primaryLanguage: varchar("primary_language", { length: 50 }).default("English"),
  consentGiven: boolean("consent_given").default(true),
  preferredHospital: text("preferred_hospital"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emergencyContacts = pgTable("emergency_contacts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  relationship: varchar("relationship", { length: 100 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 30 }).notNull(),
  isPrimary: boolean("is_primary").default(false),
  notifySms: boolean("notify_sms").default(true),
  notifyCall: boolean("notify_call").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emergencyCases = pgTable("emergency_cases", {
  id: varchar("id", { length: 64 }).primaryKey(), // e.g. RCRT-2026-89421
  userId: varchar("user_id", { length: 64 }).notNull(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  userPhone: varchar("user_phone", { length: 30 }).notNull(),
  triggerType: varchar("trigger_type", { length: 50 }).notNull(), // power_button, in_app_button, smartwatch, fall_detection
  status: varchar("status", { length: 50 }).notNull().default("sos_received"), 
  priority: varchar("priority", { length: 20 }).notNull().default("high"), // critical, high, medium, low
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  locationAccuracy: doublePrecision("location_accuracy").default(10.0), // in meters
  locationName: text("location_name"),
  batteryLevel: integer("battery_level").default(85),
  networkStatus: varchar("network_status", { length: 50 }).default("4G / 5G Active"),
  heartRate: integer("heart_rate"),
  voiceNoteUrl: text("voice_note_url"),
  voiceNoteDuration: integer("voice_note_duration"), // seconds
  photos: jsonb("photos").$type<Array<{
    url: string;
    timestamp: string;
    lat: number;
    lng: number;
    accuracy: number;
    status: string;
  }>>(),
  symptomsReported: text("symptoms_reported"),
  cancellationReason: text("cancellation_reason"),
  assignedOperatorName: varchar("assigned_operator_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const locationHistory = pgTable("location_history", {
  id: serial("id").primaryKey(),
  caseId: varchar("case_id", { length: 64 }).notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  accuracy: doublePrecision("accuracy").default(5.0),
  altitude: doublePrecision("altitude"),
  speed: doublePrecision("speed"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const caseActivityLogs = pgTable("case_activity_logs", {
  id: serial("id").primaryKey(),
  caseId: varchar("case_id", { length: 64 }).notNull(),
  actorName: varchar("actor_name", { length: 255 }).notNull(),
  actorRole: varchar("actor_role", { length: 50 }).notNull(), // user, operator, ambulance_provider, system
  action: varchar("action", { length: 255 }).notNull(),
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const hospitals = pgTable("hospitals", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  emergencyDepartmentStatus: varchar("emergency_department_status", { length: 50 }).default("active"), // active, busy, full
  bedCapacity: integer("bed_capacity").default(50),
  traumaLevel: varchar("trauma_level", { length: 20 }).default("Level 1 Trauma"),
  address: text("address").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ambulanceProviders = pgTable("ambulance_providers", {
  id: serial("id").primaryKey(),
  providerName: varchar("provider_name", { length: 255 }).notNull(),
  vehicleNumber: varchar("vehicle_number", { length: 50 }).notNull(),
  driverName: varchar("driver_name", { length: 255 }).notNull(),
  driverPhone: varchar("driver_phone", { length: 30 }).notNull(),
  vehicleType: varchar("vehicle_type", { length: 50 }).default("ALS"), // ALS, BLS, Cardiac, Neonatal
  baseLatitude: doublePrecision("base_latitude").notNull(),
  baseLongitude: doublePrecision("base_longitude").notNull(),
  currentLatitude: doublePrecision("current_latitude"),
  currentLongitude: doublePrecision("current_longitude"),
  status: varchar("status", { length: 50 }).default("available"), // available, dispatched, en_route, at_scene, offline
  createdAt: timestamp("created_at").defaultNow(),
});

export const ambulanceDispatches = pgTable("ambulance_dispatches", {
  id: serial("id").primaryKey(),
  caseId: varchar("case_id", { length: 64 }).notNull(),
  ambulanceId: integer("ambulance_id").notNull(),
  hospitalId: integer("hospital_id"),
  status: varchar("status", { length: 50 }).notNull().default("requested"), // requested, confirmed, en_route, arrived, completed, rejected
  estimatedEtaMins: integer("estimated_eta_mins"),
  providerNotes: text("provider_notes"),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
