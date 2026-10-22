"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Truck,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Search,
  ExternalLink,
  Activity,
  Radio,
} from "lucide-react";

export default function DispatchModule() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"hospitals" | "ambulances">("hospitals");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadDirectory();
  }, []);

  const loadDirectory = async () => {
    setLoading(true);
    try {
      const [hRes, aRes] = await Promise.all([fetch("/api/hospitals"), fetch("/api/ambulances")]);
      const hData = await hRes.json();
      const aData = await aRes.json();

      if (hData.success) setHospitals(hData.hospitals || []);
      if (aData.success) setAmbulances(aData.ambulanceProviders || []);
    } catch (err) {
      console.error("Error loading directory:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHospitals = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.traumaLevel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAmbulances = ambulances.filter(
    (a) =>
      a.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.vehicleType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Title Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              Verified Hospital & Ambulance Fleet Directory (India Region)
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                112 / CATS Integrated
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Verified emergency trauma centers, ALS/BLS ambulance units, and real-time bed & vehicle telemetry.
            </p>
          </div>
        </div>

        {/* Directory Search & Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search provider, city, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-950 text-white rounded-lg border border-slate-700 text-xs w-56 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab("hospitals")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "hospitals" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Hospitals ({hospitals.length})
            </button>
            <button
              onClick={() => setActiveTab("ambulances")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "ambulances" ? "bg-amber-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              <Truck className="w-3.5 h-3.5" /> Ambulances ({ambulances.length})
            </button>
          </div>
        </div>
      </div>

      {/* Verification Safety Rule Card */}
      <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-4 text-amber-200 text-xs space-y-1">
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          MedRescue Verification Safeguard & Dispatch Protocol Rules:
        </div>
        <p className="leading-relaxed">
          1. <strong>No Unconfirmed Claims:</strong> An ambulance is NEVER reported to the user as "Dispatched & Confirmed" unless explicit ACK is received from the provider's central CAD control.
          <br />
          2. <strong>Specialist ER Capability:</strong> Never assume nearest hospital has an available bed or ICU specialist without live verification.
        </p>
      </div>

      {/* Directory Content List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-slate-900 rounded-3xl border border-slate-800 animate-pulse">
          Loading provider directory...
        </div>
      ) : activeTab === "hospitals" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHospitals.map((h) => (
            <div key={h.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white space-y-3 shadow-xl hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">{h.name}</h4>
                  <p className="text-xs text-slate-400">{h.city}, {h.state}</p>
                </div>
                <span className="text-[10px] bg-blue-950 text-blue-300 font-bold px-2 py-0.5 rounded uppercase border border-blue-800">
                  {h.traumaLevel}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">ER Desk Status:</span>
                  <span className="font-bold text-emerald-400 uppercase">{h.emergencyDepartmentStatus}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">ICU Bed Capacity:</span>
                  <span className="font-semibold">{h.bedCapacity} Emergency Beds</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-emerald-400">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {h.phone}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                {h.address}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAmbulances.map((a) => (
            <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white space-y-3 shadow-xl hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">{a.providerName}</h4>
                  <p className="text-xs text-slate-400">Reg: <strong className="text-slate-200">{a.vehicleNumber}</strong></p>
                </div>
                <span className="text-[10px] bg-amber-950 text-amber-300 font-bold px-2 py-0.5 rounded uppercase border border-amber-800">
                  {a.vehicleType} Vehicle
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Driver On Duty:</span>
                  <span className="font-semibold text-white">{a.driverName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Driver Phone:</span>
                  <span className="font-semibold text-emerald-400">{a.driverPhone}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Unit Status:</span>
                  <span className="font-bold text-emerald-400 uppercase">{a.status}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400" /> GPS Telemetry Active
                </span>
                <span>Lat: {a.baseLatitude.toFixed(3)}, Lng: {a.baseLongitude.toFixed(3)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
