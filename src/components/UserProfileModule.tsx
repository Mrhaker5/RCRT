"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  Heart,
  AlertTriangle,
  Pill,
  Shield,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Lock,
  Globe,
  MessageSquare,
} from "lucide-react";

export default function UserProfileModule() {
  const [profile, setProfile] = useState({
    fullName: "Aarav Sharma",
    phone: "+91-9810012345",
    email: "aarav.sharma@example.com",
    bloodGroup: "O+",
    age: 42,
    gender: "Male",
    medicalConditions: "Hypertension, History of Arrhythmia",
    allergies: "Penicillin, Shellfish",
    currentMedications: "Amlodipine 5mg OD, Aspirin 75mg OD",
    accessibilityNeeds: "Requires clear verbal instructions; Mild hearing impairment",
    primaryLanguage: "English / Hindi",
    preferredHospital: "AIIMS New Delhi",
    consentGiven: true,
  });

  const [contacts, setContacts] = useState([
    {
      contactName: "Priya Sharma",
      relationship: "Spouse",
      phoneNumber: "+91-9810098765",
      isPrimary: true,
      notifySms: true,
      notifyCall: true,
    },
    {
      contactName: "Dr. Ramesh Verma",
      relationship: "Personal Physician",
      phoneNumber: "+91-9811122233",
      isPrimary: false,
      notifySms: true,
      notifyCall: false,
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSavingSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/user/profile?userId=USR-DEMO-8821");
      const data = await res.json();
      if (data.success) {
        if (data.user) setProfile((prev) => ({ ...prev, ...data.user }));
        if (data.contacts && data.contacts.length > 0) setContacts(data.contacts);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSavingSuccess(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "USR-DEMO-8821",
          profileData: profile,
          contacts,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavingSuccess(true);
        setTimeout(() => setSavingSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const addContact = () => {
    setContacts((prev) => [
      ...prev,
      {
        contactName: "New Emergency Contact",
        relationship: "Family / Friend",
        phoneNumber: "+91-9800000000",
        isPrimary: false,
        notifySms: true,
        notifyCall: true,
      },
    ]);
  };

  const removeContact = (index: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              User Emergency Profile & Contacts Settings
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                DPDP Act 2023 Compliant
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Your voluntarily provided medical details & emergency contacts are encrypted and accessible ONLY by authorized emergency operators during an active SOS.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 text-xs flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving Changes..." : "Save Medical Profile"}
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Profile and emergency contacts updated successfully!
        </div>
      )}

      {/* Profile Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal & Medical Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-xl">
          <h4 className="font-extrabold text-sm flex items-center gap-2 text-red-400">
            <Heart className="w-4 h-4 text-red-500" /> Personal Identification & Medical Vitals
          </h4>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Full Name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-700 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Primary Mobile Phone</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-700 text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Blood Group</label>
              <select
                value={profile.bloodGroup}
                onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
                className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-700 text-white focus:outline-none"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Age</label>
              <input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-700 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Gender</label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-700 text-white focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="text-xs space-y-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Known Allergies
              </label>
              <input
                type="text"
                value={profile.allergies}
                onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-700 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-red-400" /> Pre-existing Medical Conditions
              </label>
              <textarea
                rows={2}
                value={profile.medicalConditions}
                onChange={(e) => setProfile({ ...profile, medicalConditions: e.target.value })}
                className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-700 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                <Pill className="w-3.5 h-3.5 text-sky-400" /> Current Daily Medications
              </label>
              <input
                type="text"
                value={profile.currentMedications}
                onChange={(e) => setProfile({ ...profile, currentMedications: e.target.value })}
                className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-700 text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contacts & Consent */}
        <div className="space-y-6">
          {/* Contacts Manager */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm flex items-center gap-2 text-emerald-400">
                <Phone className="w-4 h-4 text-emerald-400" /> Designated Emergency Contacts
              </h4>
              <button
                onClick={addContact}
                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg border border-emerald-500/30 text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Contact
              </button>
            </div>

            <div className="space-y-3">
              {contacts.map((c, idx) => (
                <div key={idx} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={c.contactName}
                      onChange={(e) => {
                        const updated = [...contacts];
                        updated[idx].contactName = e.target.value;
                        setContacts(updated);
                      }}
                      className="p-1 bg-transparent text-white font-bold border-b border-slate-700 focus:outline-none"
                    />
                    <button onClick={() => removeContact(idx)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 text-[10px]">Relationship</span>
                      <input
                        type="text"
                        value={c.relationship}
                        onChange={(e) => {
                          const updated = [...contacts];
                          updated[idx].relationship = e.target.value;
                          setContacts(updated);
                        }}
                        className="w-full p-1.5 bg-slate-900 rounded text-slate-300 border border-slate-800"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px]">Phone Number</span>
                      <input
                        type="text"
                        value={c.phoneNumber}
                        onChange={(e) => {
                          const updated = [...contacts];
                          updated[idx].phoneNumber = e.target.value;
                          setContacts(updated);
                        }}
                        className="w-full p-1.5 bg-slate-900 rounded text-emerald-400 border border-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={c.notifySms}
                        onChange={(e) => {
                          const updated = [...contacts];
                          updated[idx].notifySms = e.target.checked;
                          setContacts(updated);
                        }}
                      />
                      Send SMS Alert
                    </label>

                    <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={c.notifyCall}
                        onChange={(e) => {
                          const updated = [...contacts];
                          updated[idx].notifyCall = e.target.checked;
                          setContacts(updated);
                        }}
                      />
                      Automated Voice Call
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consent & Data Protection Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-3 shadow-xl">
            <h4 className="font-extrabold text-sm flex items-center gap-2 text-sky-400">
              <Lock className="w-4 h-4 text-sky-400" /> Privacy Consent & DPDP Act Data Controls
            </h4>
            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer leading-relaxed">
              <input
                type="checkbox"
                checked={profile.consentGiven}
                onChange={(e) => setProfile({ ...profile, consentGiven: e.target.checked })}
                className="mt-0.5 rounded text-red-600 focus:ring-0"
              />
              <span>
                I explicitly grant permission for RCRT MedRescue to stream my real-time GPS location, emergency photographs, audio voice recordings, and voluntary medical profile ONLY during active emergency SOS sessions. You may revoke consent at any time.
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
