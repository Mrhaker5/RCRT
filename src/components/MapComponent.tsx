"use client";

import React, { useEffect, useRef } from "react";

interface MapComponentProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  locationName?: string;
  hospitals?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    phone: string;
    emergencyDepartmentStatus?: string;
  }>;
  ambulances?: Array<{
    id: number;
    providerName: string;
    vehicleNumber: string;
    driverName: string;
    currentLatitude?: number;
    currentLongitude?: number;
    status?: string;
  }>;
}

export default function MapComponent({
  latitude,
  longitude,
  accuracy = 5,
  locationName = "Active Emergency Location",
  hospitals = [],
  ambulances = [],
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    const el = mapContainerRef.current;
    if (typeof window === "undefined" || !el) return;

    // Dynamically import Leaflet
    import("leaflet").then((L) => {
      // Fix leaflet default icon path bug in bundlers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapInstanceRef.current) {
        const map = L.map(el).setView([latitude, longitude], 14);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
      } else {
        mapInstanceRef.current.setView([latitude, longitude], 14);
      }

      const map = mapInstanceRef.current;

      // Clear previous markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
          map.removeLayer(layer);
        }
      });

      // Red Pulsing Icon for SOS Location
      const sosIcon = L.divIcon({
        className: "custom-sos-icon",
        html: `
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-red-500 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-8 w-8 bg-red-600 border-2 border-white text-white font-bold items-center justify-center text-xs shadow-lg">
              SOS
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // User SOS Marker
      const sosMarker = L.marker([latitude, longitude], { icon: sosIcon }).addTo(map);
      sosMarker.bindPopup(`
        <div class="p-1 font-sans">
          <strong class="text-red-600 font-bold block">🚨 Patient Emergency SOS</strong>
          <p class="text-xs text-slate-700 m-0 mt-1">${locationName}</p>
          <p class="text-[11px] text-slate-500 m-0">Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}</p>
          <p class="text-[11px] text-slate-500 m-0">Accuracy: ±${accuracy}m</p>
        </div>
      `).openPopup();

      // Location accuracy radius circle
      L.circle([latitude, longitude], {
        color: "#dc2626",
        fillColor: "#ef4444",
        fillOpacity: 0.15,
        radius: Math.max(accuracy * 5, 50),
      }).addTo(map);

      // Hospital Markers
      hospitals.forEach((h) => {
        const hospitalIcon = L.divIcon({
          className: "custom-hospital-icon",
          html: `
            <div class="bg-blue-600 text-white p-1 rounded-full border-2 border-white shadow-md flex items-center justify-center w-7 h-7 text-xs font-bold">
              🏥
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker([h.latitude, h.longitude], { icon: hospitalIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-1">
              <strong class="text-blue-700 font-bold block">${h.name}</strong>
              <p class="text-xs text-slate-600 m-0">Emergency ER: ${h.emergencyDepartmentStatus?.toUpperCase() || "ACTIVE"}</p>
              <p class="text-xs text-slate-600 m-0">Phone: ${h.phone}</p>
            </div>
          `);
      });

      // Ambulance Markers
      ambulances.forEach((amb) => {
        const ambLat = amb.currentLatitude || latitude + 0.005;
        const ambLng = amb.currentLongitude || longitude + 0.005;

        const ambIcon = L.divIcon({
          className: "custom-amb-icon",
          html: `
            <div class="bg-amber-500 text-white p-1 rounded-full border-2 border-white shadow-md flex items-center justify-center w-7 h-7 text-xs font-bold">
              🚑
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker([ambLat, ambLng], { icon: ambIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-1">
              <strong class="text-amber-700 font-bold block">${amb.providerName}</strong>
              <p class="text-xs text-slate-600 m-0">Vehicle: ${amb.vehicleNumber}</p>
              <p class="text-xs text-slate-600 m-0">Driver: ${amb.driverName}</p>
              <p class="text-xs font-semibold ${amb.status === 'dispatched' ? 'text-green-600' : 'text-slate-500'} m-0">Status: ${amb.status?.toUpperCase()}</p>
            </div>
          `);
      });
    });
  }, [latitude, longitude, accuracy, locationName, hospitals, ambulances]);

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div ref={mapContainerRef} className="w-full h-full min-h-[350px] z-0" />
      
      {/* Map Overlay Badge */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 border border-slate-700 shadow-md">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>GPS Live Stream: <strong>{latitude.toFixed(4)}, {longitude.toFixed(4)}</strong> (±{accuracy}m)</span>
      </div>
    </div>
  );
}
