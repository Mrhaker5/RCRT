"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  User,
  Activity,
  Heart,
  BatteryCharging,
  Mic,
  Camera,
  Truck,
  Building2,
  FileText,
  Sparkles,
  Send,
  UserCheck,
  RotateCcw,
  Volume2,
  XCircle,
  ExternalLink,
} from "lucide-react";

// Dynamically import Map component to avoid SSR Leaflet window errors
const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

interface OperatorDashboardProps {
  initialCaseId?: string | null;
}

export default function OperatorDashboard({ initialCaseId }: OperatorDashboardProps) {
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [selectedCaseDetails, setSelectedCaseDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Hospitals & Ambulance Fleets
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const [ambulancesList, setAmbulancesList] = useState<any[]>([]);

  // Triage Assessment Form state
  const [triageForm, setTriageForm] = useState({
    userResponsive: "unknown",
    severeSymptoms: "yes",
    lifeThreatLevel: "critical",
    actionProtocol: "dispatch_als_ambulance",
    notes: "",
  });

  // AI Assistant Summary state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Dispatch Action Modal state
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<number | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);
  const [dispatchStatusMsg, setDispatchStatusMsg] = useState<string | null>(null);
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  // Operator Name
  const [operatorName] = useState("Operator #104 (Command Desk A)");

  // Load cases & directory on mount
  useEffect(() => {
    fetchCases();
    fetchHospitals();
    fetchAmbulances();
  }, [statusFilter, priorityFilter]);

  // Load specific case details when selectedCase changes
  useEffect(() => {
    if (selectedCase && selectedCase.id) {
      fetchCaseDetails(selectedCase.id);
    }
  }, [selectedCase]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      let url = `/api/cases?status=${statusFilter}&priority=${priorityFilter}`;
      if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCases(data.cases || []);
        if (data.cases.length > 0 && !selectedCase) {
          if (initialCaseId) {
            const found = data.cases.find((c: any) => c.id === initialCaseId);
            setSelectedCase(found || data.cases[0]);
          } else {
            setSelectedCase(data.cases[0]);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching cases:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/cases/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedCaseDetails(data);
      }
    } catch (err) {
      console.error("Error fetching case details:", err);
    }
  };

  const fetchHospitals = async () => {
    try {
      const res = await fetch("/api/hospitals");
      const data = await res.json();
      if (data.success) setHospitalsList(data.hospitals || []);
    } catch (err) {
      console.error("Error fetching hospitals:", err);
    }
  };

  const fetchAmbulances = async () => {
    try {
      const res = await fetch("/api/ambulances");
      const data = await res.json();
      if (data.success) setAmbulancesList(data.ambulanceProviders || []);
    } catch (err) {
      console.error("Error fetching ambulances:", err);
    }
  };

  // Update Case Status
  const handleUpdateStatus = async (newStatus: string, reason?: string) => {
    if (!selectedCase) return;
    try {
      const res = await fetch(`/api/cases/${selectedCase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          assignedOperatorName: operatorName,
          cancellationReason: reason,
          actorName: operatorName,
          actorRole: "operator",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedCase(data.case);
        fetchCases();
        fetchCaseDetails(selectedCase.id);
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Generate AI Summary Helper
  const handleGenerateAiSummary = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      const summary = `AI Summary for Case ${selectedCase.id}: Patient ${selectedCase.userName} (${selectedCase.heartRate || 115} BPM). Reported symptoms: "${selectedCase.symptomsReported}". High cardiac emergency risk. Recommended immediate ALS ambulance dispatch to nearby AIIMS / Fortis trauma center.`;
      setAiSummary(summary);
      setIsGeneratingAi(false);
    }, 800);
  };

  // Request Ambulance Dispatch
  const handleRequestDispatch = async () => {
    if (!selectedCase || !selectedAmbulanceId) return;
    setIsSubmittingDispatch(true);
    setDispatchStatusMsg(null);

    try {
      const res = await fetch(`/api/cases/${selectedCase.id}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_dispatch",
          ambulanceId: selectedAmbulanceId,
          hospitalId: selectedHospitalId,
          estimatedEtaMins: 12,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDispatchStatusMsg("✅ Dispatch request sent to provider control desk. Status updated to Ambulance Requested.");
        fetchCases();
        fetchCaseDetails(selectedCase.id);
      } else {
        setDispatchStatusMsg(`❌ Failed: ${data.error}`);
      }
    } catch (err: any) {
      setDispatchStatusMsg(`❌ Error: ${err.message}`);
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  // Simulate Provider Explicit Confirmation
  const handleConfirmDispatchByProvider = async (dispatchId: number) => {
    try {
      const res = await fetch(`/api/cases/${selectedCase.id}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm_dispatch",
          dispatchId,
          estimatedEtaMins: 10,
          providerNotes: "Driver Rajesh Kumar confirmed dispatch via 108 CAD radio terminal.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCases();
        fetchCaseDetails(selectedCase.id);
      }
    } catch (err) {
      console.error("Error confirming dispatch:", err);
    }
  };

  // Status color pill helper
  const getStatusBadge = (st: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      sos_received: { bg: "bg-red-500/20 border-red-500/40", text: "text-red-400", label: "SOS Received" },
      operator_reviewing: { bg: "bg-amber-500/20 border-amber-500/40", text: "text-amber-300", label: "Operator Reviewing" },
      assistance_required: { bg: "bg-purple-500/20 border-purple-500/40", text: "text-purple-300", label: "Assistance Required" },
      ambulance_requested: { bg: "bg-blue-500/20 border-blue-500/40", text: "text-blue-300", label: "Ambulance Requested" },
      ambulance_confirmed: { bg: "bg-emerald-500/20 border-emerald-500/40", text: "text-emerald-300", label: "Ambulance Confirmed" },
      ambulance_en_route: { bg: "bg-indigo-500/20 border-indigo-500/40", text: "text-indigo-300", label: "Ambulance En Route" },
      hospital_contacted: { bg: "bg-teal-500/20 border-teal-500/40", text: "text-teal-300", label: "Hospital Contacted" },
      resolved: { bg: "bg-slate-700/50 border-slate-600", text: "text-slate-300", label: "Resolved" },
      cancelled: { bg: "bg-slate-800/80 border-slate-700", text: "text-slate-400", label: "Cancelled / False" },
    };

    const conf = map[st] || { bg: "bg-slate-800 border-slate-700", text: "text-slate-300", label: st.replace(/_/g, " ") };
    return (
      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-wider ${conf.bg} ${conf.text}`}>
        {conf.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Operator Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              RCRT Central Command Center & Operator Desk
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Logged in as {operatorName}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Real-time emergency dispatch queue, GIS triage mapping, patient telemetry & verified provider dispatch.
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search case ID, name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchCases()}
              className="pl-9 pr-3 py-1.5 bg-slate-950 text-white rounded-lg border border-slate-700 text-xs w-56 focus:outline-none focus:border-red-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 text-white rounded-lg border border-slate-700 text-xs focus:outline-none focus:border-red-500"
          >
            <option value="all">All Statuses</option>
            <option value="sos_received">SOS Received</option>
            <option value="operator_reviewing">Operator Reviewing</option>
            <option value="assistance_required">Assistance Required</option>
            <option value="ambulance_requested">Ambulance Requested</option>
            <option value="ambulance_confirmed">Ambulance Confirmed</option>
            <option value="resolved">Resolved</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Cases List (4 cols) + Case Active Workspace (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Cases List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>LIVE INCOMING CASES ({cases.length})</span>
            <button onClick={fetchCases} className="text-slate-400 hover:text-white flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-900 rounded-2xl border border-slate-800 animate-pulse">
              Loading active emergency queue...
            </div>
          ) : cases.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-900 rounded-2xl border border-slate-800">
              No active emergency cases found matching filters.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {cases.map((c) => {
                const isSelected = selectedCase?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? "bg-slate-900 border-red-500/80 shadow-lg shadow-red-950/40"
                        : "bg-slate-950 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{c.id}</span>
                          <span className="text-[10px] bg-red-950 text-red-300 font-bold px-2 py-0.5 rounded uppercase border border-red-800">
                            {c.priority}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-300 mt-0.5">{c.userName}</p>
                      </div>
                      {getStatusBadge(c.status)}
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="truncate">{c.locationName || `${c.latitude.toFixed(3)}, ${c.longitude.toFixed(3)}`}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Trigger: <strong className="text-slate-300">{c.triggerType.replace(/_/g, " ")}</strong></span>
                        <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Case Workspace & Triage Operator Panel */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCase && selectedCaseDetails ? (
            <div className="space-y-6">
              {/* Header Card for Selected Case */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-extrabold tracking-wide text-white">{selectedCase.id}</h2>
                      {getStatusBadge(selectedCase.status)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Created: {new Date(selectedCase.createdAt).toLocaleString()} • Assigned to: <strong>{selectedCase.assignedOperatorName || "Unassigned"}</strong>
                    </p>
                  </div>

                  {/* Operator Quick Status Actions */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <button
                      onClick={() => handleUpdateStatus("operator_reviewing")}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg border border-amber-500/30 font-medium"
                    >
                      Start Review
                    </button>
                    <button
                      onClick={() => setShowDispatchModal(true)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-md shadow-red-600/30 flex items-center gap-1.5"
                    >
                      <Truck className="w-4 h-4" /> Coordinate Dispatch
                    </button>
                    <button
                      onClick={() => handleUpdateStatus("resolved")}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg border border-emerald-500/30 font-medium"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>

                {/* Patient Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Patient Name</span>
                    <strong className="text-white font-semibold">{selectedCaseDetails.userProfile?.fullName || selectedCase.userName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Phone / Contact</span>
                    <strong className="text-emerald-400 font-semibold">{selectedCase.userPhone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Blood Group & Age</span>
                    <strong className="text-red-400 font-semibold">{selectedCaseDetails.userProfile?.bloodGroup || "O+"} • {selectedCaseDetails.userProfile?.age || 42} Yrs</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Watch Pulse Telemetry</span>
                    <strong className="text-red-400 font-semibold flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 animate-pulse" /> {selectedCase.heartRate || 115} BPM
                    </strong>
                  </div>
                </div>

                {/* Medical History & Allergies voluntarly provided */}
                <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-3 text-xs space-y-1 text-slate-300">
                  <div className="flex items-center gap-2 font-semibold text-red-300">
                    <AlertTriangle className="w-4 h-4" /> Medical Profile & Allergies (Voluntarily Disclosed):
                  </div>
                  <p><strong>Known Allergies:</strong> {selectedCaseDetails.userProfile?.allergies || "Penicillin, Shellfish"}</p>
                  <p><strong>Pre-existing Conditions:</strong> {selectedCaseDetails.userProfile?.medicalConditions || "Hypertension, History of Arrhythmia"}</p>
                  <p><strong>Current Medications:</strong> {selectedCaseDetails.userProfile?.currentMedications || "Amlodipine 5mg, Aspirin 75mg"}</p>
                </div>
              </div>

              {/* Map & Geolocation Viewer */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 text-white space-y-3 shadow-xl">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-red-400" />
                    Patient GPS Location Telemetry & Nearest Emergency Facilities
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {selectedCase.locationName || `${selectedCase.latitude}, ${selectedCase.longitude}`}
                  </span>
                </div>

                <div className="h-[380px] w-full rounded-2xl overflow-hidden">
                  <MapComponent
                    latitude={selectedCase.latitude}
                    longitude={selectedCase.longitude}
                    accuracy={selectedCase.locationAccuracy || 5}
                    locationName={selectedCase.locationName || "Patient Emergency SOS"}
                    hospitals={hospitalsList}
                    ambulances={ambulancesList}
                  />
                </div>
              </div>

              {/* Triage Assessment & Structured Operator Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-sky-400" />
                    Structured Operator Emergency Triage Assessment
                  </h3>
                  <button
                    onClick={handleGenerateAiSummary}
                    disabled={isGeneratingAi}
                    className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg border border-purple-500/30 text-xs font-medium flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isGeneratingAi ? "Analyzing..." : "Generate AI Case Summary"}
                  </button>
                </div>

                {aiSummary && (
                  <div className="bg-purple-950/40 border border-purple-800 p-3.5 rounded-2xl text-xs text-purple-200 space-y-1">
                    <strong className="block text-purple-300 font-bold">AI Decision Support (Assistive Only):</strong>
                    <p>{aiSummary}</p>
                    <span className="text-[10px] text-purple-400 block pt-1">
                      ⚠️ Disclaimer: AI organizes data & translates messages under approved guidelines. Clinical dispatch decisions are made solely by human operators.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">User Responsiveness</label>
                    <select
                      value={triageForm.userResponsive}
                      onChange={(e) => setTriageForm({ ...triageForm, userResponsive: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-700 text-white focus:outline-none"
                    >
                      <option value="responsive">User Communicating / Responsive</option>
                      <option value="unresponsive">User Unresponsive / Unable to Speak</option>
                      <option value="unknown">Unknown / Static Noise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Severe Symptoms / Injury</label>
                    <select
                      value={triageForm.severeSymptoms}
                      onChange={(e) => setTriageForm({ ...triageForm, severeSymptoms: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-700 text-white focus:outline-none"
                    >
                      <option value="yes">Severe Chest Pain / Breathing Difficulty / Trauma</option>
                      <option value="moderate">Moderate Injury / Fall</option>
                      <option value="minor">Minor Assistance Needed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Geotagged Emergency Photos & Audio Voice Note */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Media Photos */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white space-y-3 shadow-xl">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-slate-300">
                    <Camera className="w-4 h-4 text-sky-400" />
                    Geotagged Emergency Photos ({selectedCase.photos?.length || 0})
                  </span>

                  {selectedCase.photos && selectedCase.photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedCase.photos.map((p: any, idx: number) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                          <img src={p.url} alt="SOS Media" className="w-full h-32 object-cover" />
                          <div className="p-2 bg-slate-950/90 text-[10px] text-slate-300">
                            <span>Lat: {p.lat?.toFixed(4)}, Lng: {p.lng?.toFixed(4)}</span>
                            <span className="block text-emerald-400">{p.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                      No emergency photos uploaded yet for this session.
                    </div>
                  )}
                </div>

                {/* Voice Recording Player */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white space-y-3 shadow-xl">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-slate-300">
                    <Mic className="w-4 h-4 text-emerald-400" />
                    15-Second Emergency Voice Recording
                  </span>

                  {selectedCase.voiceNoteUrl ? (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-emerald-300">
                        <span className="flex items-center gap-2 font-medium">
                          <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                          Voice Note ({selectedCase.voiceNoteDuration || 15}s)
                        </span>
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded">
                          Encrypted Transferred
                        </span>
                      </div>
                      <audio src={selectedCase.voiceNoteUrl} controls className="w-full h-8" />
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                      No voice recording attached.
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Audit Log */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-xl">
                <h4 className="font-extrabold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Auditable Case Activity Log ({selectedCaseDetails.activityLogs?.length || 0} Events)
                </h4>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {selectedCaseDetails.activityLogs?.map((log: any) => (
                    <div key={log.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-200">{log.action}</span>
                        <span className="text-slate-500 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{log.notes}</p>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 pt-1">
                        <span>Actor: <strong>{log.actorName}</strong> ({log.actorRole})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-3xl border border-slate-800">
              Select an active case from the left queue to open the triage workspace.
            </div>
          )}
        </div>
      </div>

      {/* Coordinate Ambulance Dispatch Modal */}
      {showDispatchModal && selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-red-600 rounded-3xl p-6 text-white max-w-2xl w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-lg flex items-center gap-2 text-red-400">
                  <Truck className="w-5 h-5 text-red-500" />
                  Ambulance & Hospital Dispatch Control
                </h3>
                <p className="text-xs text-slate-400">
                  Case ID: <strong>{selectedCase.id}</strong> • Patient: <strong>{selectedCase.userName}</strong>
                </p>
              </div>
              <button onClick={() => setShowDispatchModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {dispatchStatusMsg && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-700 text-xs">
                {dispatchStatusMsg}
              </div>
            )}

            {/* Select Ambulance Provider */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">Select Nearby Ambulance Fleet Provider</label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {ambulancesList.map((amb) => (
                  <div
                    key={amb.id}
                    onClick={() => setSelectedAmbulanceId(amb.id)}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                      selectedAmbulanceId === amb.id
                        ? "bg-red-950/60 border-red-500 text-white font-semibold"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <strong className="block text-white">{amb.providerName}</strong>
                      <span className="text-[11px] text-slate-400">
                        Vehicle: {amb.vehicleNumber} ({amb.vehicleType}) • Driver: {amb.driverName} ({amb.driverPhone})
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-bold uppercase">
                      {amb.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Select Receiving Hospital */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">Select Destination Hospital Trauma Center</label>
              <select
                value={selectedHospitalId || ""}
                onChange={(e) => setSelectedHospitalId(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-700 text-xs text-white focus:outline-none"
              >
                <option value="">-- Select Receiving Hospital --</option>
                {hospitalsList.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.city}) - ER: {h.emergencyDepartmentStatus?.toUpperCase()} - {h.traumaLevel}
                  </option>
                ))}
              </select>
            </div>

            {/* Crucial Safety Disclaimer Notice */}
            <div className="bg-amber-950/40 border border-amber-800 p-3 rounded-xl text-[11px] text-amber-200">
              <strong>⚠️ Safety Protocol Enforcement:</strong> The system will set state to <em>Ambulance Requested</em>. It will <strong>NEVER</strong> mark dispatch <em>CONFIRMED</em> until explicit provider confirmation is received from the fleet operator!
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestDispatch}
                disabled={isSubmittingDispatch || !selectedAmbulanceId}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/40 text-xs flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                {isSubmittingDispatch ? "Sending Request..." : "Send Dispatch Request"}
              </button>
            </div>

            {/* Provider Confirmation Simulator Button */}
            {selectedCaseDetails?.dispatches?.length > 0 && (
              <div className="pt-3 border-t border-slate-800">
                <p className="text-xs font-bold text-slate-300 mb-2">Simulate Provider Control Desk Confirmation:</p>
                {selectedCaseDetails.dispatches.map((disp: any) => (
                  <div key={disp.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span>Dispatch Request #{disp.id} Status: <strong className="text-amber-400 uppercase">{disp.status}</strong></span>
                    </div>
                    {disp.status === "requested" && (
                      <button
                        onClick={() => handleConfirmDispatchByProvider(disp.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded"
                      >
                        Simulate Provider ACK & Confirm
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
