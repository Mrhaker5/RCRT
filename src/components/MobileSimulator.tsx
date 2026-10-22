"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldAlert,
  Smartphone,
  Watch,
  Mic,
  Camera,
  MapPin,
  Wifi,
  WifiOff,
  BatteryCharging,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Clock,
  RotateCcw,
  Zap,
  Activity,
  Heart,
  Volume2,
  User,
  Phone,
  Radio,
} from "lucide-react";

interface MobileSimulatorProps {
  onCaseCreated?: (caseId: string) => void;
}

export default function MobileSimulator({ onCaseCreated }: MobileSimulatorProps) {
  // Device & Network State
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [queuedItems, setQueuedItems] = useState<any[]>([]);
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [heartRate, setHeartRate] = useState(115);

  // Active Emergency Session
  const [activeCase, setActiveCase] = useState<any | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [triggerType, setTriggerType] = useState<string>("in_app_button");

  // Location State
  const [location, setLocation] = useState({
    latitude: 28.5672,
    longitude: 77.2100,
    accuracy: 4.5,
    city: "New Delhi (AIIMS Vicinity)",
  });
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  // Media Capture State
  const [photos, setPhotos] = useState<Array<{ url: string; timestamp: string; lat: number; lng: number }>>([]);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | null>(null);
  const audioTimerRef = useRef<any>(null);

  // Power button press counter
  const [powerPresses, setPowerPresses] = useState(0);

  // Countdown effect
  useEffect(() => {
    let timer: any = null;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      // Countdown reached 0 -> Finalize SOS Dispatch
      setCountdown(null);
      executeSOSCreation(triggerType);
    }
    return () => clearTimeout(timer);
  }, [countdown, triggerType]);

  // Audio recording timer
  useEffect(() => {
    if (isRecordingAudio) {
      audioTimerRef.current = setInterval(() => {
        setAudioDuration((prev) => {
          if (prev >= 15) {
            stopAudioRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    }
    return () => {
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    };
  }, [isRecordingAudio]);

  // Power button press handler
  const handlePowerButtonPress = () => {
    setPowerPresses((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        startSOSWorkflow("power_button");
        return 0;
      }
      setTimeout(() => setPowerPresses(0), 1500);
      return next;
    });
  };

  // Start SOS Workflow (initiates 10-second safety countdown)
  const startSOSWorkflow = (type: string) => {
    setTriggerType(type);
    setCountdown(10); // 10 second safety countdown
  };

  // Instant Immediate Escalation
  const escalateImmediately = () => {
    setCountdown(null);
    executeSOSCreation(triggerType);
  };

  // Cancel Accidental SOS
  const cancelSOS = async (reason: string = "Accidental tap by user") => {
    setCountdown(null);
    if (activeCase) {
      try {
        await fetch(`/api/cases/${activeCase.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "cancelled",
            cancellationReason: reason,
            actorName: "User (Handset)",
            actorRole: "user",
          }),
        });
      } catch (err) {
        console.error("Error cancelling SOS:", err);
      }
      setActiveCase(null);
    }
  };

  // Execute actual API call to create SOS case
  const executeSOSCreation = async (type: string) => {
    const payload = {
      userId: "USR-DEMO-8821",
      userName: "Aarav Sharma",
      userPhone: "+91-9810012345",
      triggerType: type,
      latitude: location.latitude,
      longitude: location.longitude,
      locationAccuracy: location.accuracy,
      locationName: location.city,
      batteryLevel,
      networkStatus: isOfflineMode ? "Offline (Queued)" : "5G Active",
      heartRate,
      symptomsReported: type === "power_button" ? "Triple-Press Power Button Activation" : "In-App / Smartwatch Emergency Activation",
      priority: "critical",
    };

    if (isOfflineMode) {
      const qItem = { id: `QUEUE-${Date.now()}`, timestamp: new Date().toLocaleTimeString(), payload };
      setQueuedItems((prev) => [...prev, qItem]);
      setActiveCase({
        id: `QUEUED-LOCAL-${Math.floor(Math.random() * 1000)}`,
        status: "queued_locally",
        latitude: location.latitude,
        longitude: location.longitude,
        locationName: location.city,
      });
      return;
    }

    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setActiveCase(data.case);
        if (onCaseCreated) onCaseCreated(data.caseId);
      }
    } catch (err) {
      console.error("Failed to create SOS case:", err);
    }
  };

  // Retry offline queue sync
  const syncOfflineQueue = async () => {
    if (queuedItems.length === 0) return;
    for (const item of queuedItems) {
      try {
        const res = await fetch("/api/cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        const data = await res.json();
        if (data.success && !activeCase) {
          setActiveCase(data.case);
        }
      } catch (err) {
        console.error("Sync error:", err);
      }
    }
    setQueuedItems([]);
    setIsOfflineMode(false);
  };

  // Simulate Photo Capture
  const handleCapturePhoto = async () => {
    if (!activeCase || activeCase.status === "queued_locally") {
      alert("Please trigger an active emergency session first to attach geotagged media!");
      return;
    }

    const sampleImages = [
      "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=600&q=80",
    ];
    const picked = sampleImages[photos.length % sampleImages.length];

    try {
      const res = await fetch(`/api/cases/${activeCase.id}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "photo",
          photoUrl: picked,
          lat: location.latitude,
          lng: location.longitude,
          accuracy: location.accuracy,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPhotos(data.photos || []);
      }
    } catch (err) {
      console.error("Photo upload error:", err);
    }
  };

  // Voice Note Record / Stop
  const startAudioRecording = () => {
    if (!activeCase || activeCase.status === "queued_locally") {
      alert("Please trigger an active emergency session first!");
      return;
    }
    setIsRecordingAudio(true);
    setAudioDuration(0);
  };

  const stopAudioRecording = async () => {
    setIsRecordingAudio(false);
    const mockUrl = "/audio/sample_emergency_voice_note.mp3";
    setVoiceNoteUrl(mockUrl);

    if (activeCase && activeCase.id) {
      try {
        await fetch(`/api/cases/${activeCase.id}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "voice_note",
            voiceNoteUrl: mockUrl,
            voiceNoteDuration: audioDuration || 15,
          }),
        });
      } catch (err) {
        console.error("Voice note upload error:", err);
      }
    }
  };

  // Change location simulator preset
  const setCityPreset = (city: string, lat: number, lng: number) => {
    setIsUpdatingLocation(true);
    setLocation({ city, latitude: lat, longitude: lng, accuracy: Math.floor(3 + Math.random() * 5) });
    setTimeout(() => {
      setIsUpdatingLocation(false);

      // If active case, push live location update
      if (activeCase && activeCase.id && activeCase.status !== "queued_locally") {
        fetch(`/api/cases/${activeCase.id}/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: lat,
            longitude: lng,
            accuracy: 4.2,
            locationName: city,
          }),
        });
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
            <Smartphone className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              RCRT MedRescue Handset & Smartwatch Environment
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
                Live Simulator
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Simulates physical power button shortcuts, Wear OS smartwatch SOS gestures, GPS telemetry & offline queues.
            </p>
          </div>
        </div>

        {/* Device Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button
            onClick={() => {
              setIsOfflineMode(!isOfflineMode);
              if (isOfflineMode) syncOfflineQueue();
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              isOfflineMode
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
            }`}
          >
            {isOfflineMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            {isOfflineMode ? "Network: Offline (Queue Mode)" : "Network: 5G Active"}
          </button>

          <div className="bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-700">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            <span>Battery: {batteryLevel}%</span>
          </div>

          <div className="bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-700">
            <Heart className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>Watch Pulse: {heartRate} BPM</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Handset Simulator + Wear OS Smartwatch Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Android Handset Simulator (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 rounded-3xl p-6 border-4 border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Phone Notch & Speaker Bar */}
          <div className="flex justify-between items-center text-slate-400 text-xs mb-4 pb-2 border-b border-slate-800">
            <span className="font-semibold text-white">09:41 AM</span>
            <div className="w-20 h-4 bg-slate-800 rounded-full flex justify-center items-center">
              <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700"></div>
            </div>
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isOfflineMode ? "No Signal" : "RCRT 5G"}</span>
            </div>
          </div>

          {/* Active Emergency Safety Countdown Modal */}
          {countdown !== null && (
            <div className="bg-red-950/90 backdrop-blur-md border-2 border-red-600 rounded-2xl p-6 text-center text-white space-y-4 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-full bg-red-600/30 border-2 border-red-500 flex items-center justify-center mx-auto text-3xl font-extrabold text-red-400 animate-bounce">
                {countdown}
              </div>
              <div>
                <h4 className="font-bold text-xl text-red-200">EMERGENCY SOS ACTIVATED</h4>
                <p className="text-xs text-red-300 mt-1">
                  Trigger source: <strong className="uppercase">{triggerType.replace(/_/g, " ")}</strong>
                </p>
                <p className="text-xs text-slate-300 mt-2">
                  Emergency alert, GPS location, medical profile & contacts will be dispatched to RCRT Operator Command in <strong>{countdown}s</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => cancelSOS("Accidental activation during countdown")}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-600 text-xs flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4 text-slate-400" />
                  I Am Safe - Cancel
                </button>
                <button
                  onClick={escalateImmediately}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/40 text-xs flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 animate-pulse" />
                  Escalate Immediately
                </button>
              </div>
            </div>
          )}

          {/* Active Session Status Card */}
          {activeCase && countdown === null && (
            <div className="mb-6 bg-red-950/60 border border-red-800/80 rounded-2xl p-4 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
                <div>
                  <div className="font-bold text-sm text-red-300 flex items-center gap-2">
                    ACTIVE SOS: {activeCase.id}
                    <span className="text-[10px] bg-red-900 text-red-200 px-2 py-0.5 rounded-full uppercase">
                      {activeCase.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Location: {activeCase.locationName || location.city} (±{location.accuracy}m)
                  </p>
                </div>
              </div>
              <button
                onClick={() => cancelSOS("User requested cancellation after rescue")}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5 text-red-400" />
                Cancel Session
              </button>
            </div>
          )}

          {/* Core Emergency Activation Hub */}
          <div className="space-y-6">
            {/* Big In-App Emergency Button */}
            <div className="text-center py-4 bg-slate-900/60 rounded-2xl border border-slate-800 p-6">
              <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider font-semibold">
                In-App Emergency Action Button
              </p>

              <button
                onClick={() => startSOSWorkflow("in_app_button")}
                disabled={countdown !== null}
                className="group relative inline-flex items-center justify-center p-8 rounded-full bg-gradient-to-b from-red-500 to-red-700 text-white shadow-2xl shadow-red-600/50 hover:scale-105 active:scale-95 transition-all duration-200 border-4 border-red-400/50"
              >
                <div className="text-center">
                  <ShieldAlert className="w-16 h-16 mx-auto mb-1 group-hover:animate-pulse" />
                  <span className="block font-black text-xl tracking-wide">SOS EMERGENCY</span>
                  <span className="block text-[11px] text-red-100 opacity-90 font-normal">
                    PRESS FOR IMMEDIATE MEDICAL HELP
                  </span>
                </div>
              </button>
            </div>

            {/* Hardware Power Button Simulation (Triple-Press) */}
            <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Triple-Press Power Button Shortcut
                </span>
                <span className="text-[11px] text-slate-400">
                  Presses registered: <strong className="text-amber-400 font-bold">{powerPresses} / 3</strong>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePowerButtonPress}
                  className="flex-1 py-3 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold rounded-xl border border-amber-500/40 text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  Simulate Rapid Power Button Press ({powerPresses > 0 ? `${powerPresses} Tap` : "Click 3x"})
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Note: In production Android app, uses approved Manufacturer Accessibility Service / Emergency Shortcut API to catch 3x rapid physical power key presses.
              </p>
            </div>

            {/* Sensor Data & Camera / Mic Emergency Capture */}
            <div className="grid grid-cols-2 gap-4">
              {/* Camera Photo Capture */}
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 text-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-300">
                    <Camera className="w-4 h-4 text-sky-400" />
                    Geotagged Photo Capture
                  </span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                    {photos.length} Captured
                  </span>
                </div>

                <button
                  onClick={handleCapturePhoto}
                  className="w-full py-2.5 px-3 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 font-medium rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Take Emergency Snapshot
                </button>

                {photos.length > 0 && (
                  <div className="space-y-1.5">
                    {photos.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] bg-slate-800/80 p-2 rounded-lg">
                        <img src={p.url} alt="Snap" className="w-8 h-8 rounded object-cover" />
                        <div className="truncate">
                          <span className="block text-slate-300 font-medium truncate">Photo #{idx + 1}</span>
                          <span className="text-slate-400 text-[10px]">
                            {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Voice Recording 15s */}
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 text-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-300">
                    <Mic className="w-4 h-4 text-emerald-400" />
                    15s Voice Note
                  </span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400">
                    {audioDuration}s / 15s
                  </span>
                </div>

                {!isRecordingAudio ? (
                  <button
                    onClick={startAudioRecording}
                    className="w-full py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium rounded-xl text-xs flex items-center justify-center gap-2"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    Record 15s Audio Note
                  </button>
                ) : (
                  <button
                    onClick={stopAudioRecording}
                    className="w-full py-2.5 px-3 bg-red-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 animate-pulse"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Stop & Upload ({audioDuration}s)
                  </button>
                )}

                {voiceNoteUrl && (
                  <div className="bg-slate-800 p-2 rounded-lg flex items-center justify-between text-[11px] text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      Voice Note Ready ({audioDuration}s)
                    </span>
                    <audio src={voiceNoteUrl} controls className="h-6 w-24" />
                  </div>
                )}
              </div>
            </div>

            {/* Simulated Location Preset Switcher */}
            <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 text-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-400" />
                  GPS Telemetry & Preset Location Generator
                </span>
                {isUpdatingLocation && (
                  <span className="text-[10px] text-amber-400 animate-pulse">Locking GPS...</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setCityPreset("New Delhi (AIIMS Vicinity)", 28.5672, 77.2100)}
                  className={`py-2 px-2 rounded-lg text-xs text-left transition-all ${
                    location.city.includes("New Delhi")
                      ? "bg-red-600 text-white font-bold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  📍 New Delhi AIIMS
                </button>

                <button
                  onClick={() => setCityPreset("Bengaluru (Bannerghatta Rd)", 12.8945, 77.5989)}
                  className={`py-2 px-2 rounded-lg text-xs text-left transition-all ${
                    location.city.includes("Bengaluru")
                      ? "bg-red-600 text-white font-bold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  📍 Bengaluru Apollo
                </button>

                <button
                  onClick={() => setCityPreset("Mumbai (Bandra West)", 19.0512, 72.8285)}
                  className={`py-2 px-2 rounded-lg text-xs text-left transition-all ${
                    location.city.includes("Mumbai")
                      ? "bg-red-600 text-white font-bold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  📍 Mumbai Lilavati
                </button>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Lat: <strong className="text-slate-200">{location.latitude.toFixed(4)}</strong></span>
                <span>Lng: <strong className="text-slate-200">{location.longitude.toFixed(4)}</strong></span>
                <span>Accuracy: <strong className="text-emerald-400">±{location.accuracy}m</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Smartwatch Companion Wear OS Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Smartwatch OLED Frame */}
          <div className="bg-slate-950 rounded-[40px] p-6 border-8 border-slate-800 shadow-2xl text-white relative flex flex-col items-center justify-center min-h-[460px]">
            {/* Watch Crown / Physical SOS Button */}
            <button
              onClick={() => startSOSWorkflow("smartwatch")}
              title="Physical Smartwatch SOS Button"
              className="absolute -right-5 top-1/2 -translate-y-1/2 w-4 h-14 bg-red-600 hover:bg-red-500 rounded-r-xl border border-red-400 shadow-md cursor-pointer flex items-center justify-center text-[9px] text-white font-bold tracking-tighter uppercase font-mono shadow-red-500/40"
            >
              SOS
            </button>

            {/* Circular Screen Container */}
            <div className="w-[300px] h-[300px] rounded-full bg-slate-900 border-4 border-slate-700 p-6 flex flex-col justify-between items-center text-center shadow-inner relative overflow-hidden">
              {/* Watch Header */}
              <div className="flex items-center justify-between w-full px-4 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1 text-red-400">
                  <Heart className="w-3 h-3 animate-pulse" /> {heartRate} BPM
                </span>
                <span>09:41</span>
                <span className="text-emerald-400">92%</span>
              </div>

              {/* Watch Center Content */}
              <div className="space-y-3 my-auto">
                <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500 flex items-center justify-center mx-auto text-red-400">
                  <Watch className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-wide">RCRT WATCH OS</h4>
                  <p className="text-[10px] text-slate-400">Wear OS Companion Companion Active</p>
                </div>

                <button
                  onClick={() => startSOSWorkflow("smartwatch")}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-full shadow-lg shadow-red-600/50 border border-red-400 flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4" />
                  TRIGGER WATCH SOS
                </button>
              </div>

              {/* Watch Footer Telemetry */}
              <div className="text-[10px] text-slate-400 pb-1">
                <span>GPS: Active</span> • <span>LTE Fallback: Ready</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center mt-4 max-w-xs">
              <strong>Wear OS & Apple Watch Integration:</strong> Dedicated physical crown gesture triggers instant alert with heart-rate pulse telemetry & standalone cellular fallback.
            </p>
          </div>

          {/* Offline Queue Items Summary */}
          {queuedItems.length > 0 && (
            <div className="bg-amber-950/80 border border-amber-800 rounded-2xl p-4 text-amber-200 text-xs space-y-2">
              <div className="font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Queued Offline Packets ({queuedItems.length})
                </span>
                <button
                  onClick={syncOfflineQueue}
                  className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-[10px]"
                >
                  Force Sync Now
                </button>
              </div>
              <p className="text-[11px] text-amber-300">
                Network connection unavailable. Emergency packets stored locally using exponential retry backoff.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Square(props: any) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
