"use client";

import React, { useState, useEffect } from "react";
import MobileSimulator from "@/components/MobileSimulator";
import OperatorDashboard from "@/components/OperatorDashboard";
import DispatchModule from "@/components/DispatchModule";
import UserProfileModule from "@/components/UserProfileModule";
import DocsAndComplianceModule from "@/components/DocsAndComplianceModule";
import {
  ShieldAlert,
  Smartphone,
  Building2,
  User,
  FileText,
  Activity,
  Heart,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    "simulator" | "operator" | "dispatch" | "profile" | "docs"
  >("simulator");

  const [activeCaseId, setActiveCaseId] = useState<string | null>("RCRT-2026-9812");
  const [seedDone, setSeedDone] = useState(false);

  // Auto seed on load if required
  useEffect(() => {
    fetch("/api/seed", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        setSeedDone(true);
      })
      .catch((err) => console.error("Seed error:", err));
  }, []);

  const handleCaseCreated = (caseId: string) => {
    setActiveCaseId(caseId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-600 selection:text-white pb-12">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center text-white shadow-lg shadow-red-600/40 border border-red-400/40">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg tracking-tight text-white">
                  RCRT MedRescue SOS
                </h1>
                <span className="text-[10px] bg-red-600/20 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/30 uppercase tracking-wider">
                  India Operations
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Smart Medical Emergency Response & Verified Dispatch Network
              </p>
            </div>
          </div>

          {/* Emergency Hotline Quick Badge */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-slate-300">National Emergency Portal: <strong>112 / 108 CAD</strong></span>
            </div>
            <div className="bg-red-950/60 px-3 py-1.5 rounded-xl border border-red-800/80 text-red-300 font-semibold flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-red-400" />
              <span>Operator Line Active</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60 overflow-x-auto">
          <nav className="flex space-x-2 py-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("simulator")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "simulator"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Mobile & Watch SOS Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab("operator")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "operator"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Operator Command Desk</span>
              {activeCaseId && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("dispatch")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "dispatch"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Hospitals & Ambulance Fleet</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "profile"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Medical Profile & Contacts</span>
            </button>

            <button
              onClick={() => setActiveTab("docs")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "docs"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Architecture, Matrix & Test Suite</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === "simulator" && (
          <MobileSimulator onCaseCreated={handleCaseCreated} />
        )}

        {activeTab === "operator" && (
          <OperatorDashboard initialCaseId={activeCaseId} />
        )}

        {activeTab === "dispatch" && <DispatchModule />}

        {activeTab === "profile" && <UserProfileModule />}

        {activeTab === "docs" && <DocsAndComplianceModule />}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-800/80 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-400">RCRT MedRescue SOS • Healthcare Technology Platform</p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Designed for emergency medical dispatch under applicable medical, regulatory & DPDP Act India standards.
          </p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Target Market: India (112 / CATS Integration)</span>
          <span>•</span>
          <span>PostgreSQL + Drizzle ORM</span>
        </div>
      </footer>
    </div>
  );
}
