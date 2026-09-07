'use client';

import React, { useState } from 'react';
import { Layers, CheckCircle2, XCircle, MapPin, Eye, Edit3 } from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  polygonCoordinates: Array<{ lat: number; lng: number }>;
  isActive: boolean;
  availableServices: string;
}

interface CampusZoneMapProps {
  zones: Zone[];
  isAdmin?: boolean;
  onUpdateZone?: (zone: Zone) => void;
}

export function CampusZoneMap({ zones, isAdmin = false, onUpdateZone }: CampusZoneMapProps) {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(zones[0] || null);

  // Approximate coordinate bounding box for NIT Durgapur
  const minLat = 23.5400;
  const maxLat = 23.5560;
  const minLng = 87.2840;
  const maxLng = 87.3020;

  // Convert GPS coordinates to SVG viewBox percentages (800 x 500)
  const toSvgX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * 760 + 20;
  const toSvgY = (lat: number) => 480 - ((lat - minLat) / (maxLat - minLat)) * 440;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">NIT Durgapur Service Geofence Map</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time visual map of verified delivery perimeters across academic and hostel complexes.
          </p>
        </div>

        {/* Zone Selector Pills */}
        <div className="flex flex-wrap gap-2">
          {zones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => setSelectedZone(zone)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedZone?.id === zone.id
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  zone.isActive ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              />
              {zone.name.split('-')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Interactive Campus Map Projection */}
      <div className="relative w-full h-80 sm:h-96 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full"
          style={{ background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)' }}
        >
          {/* Subtle Campus Grid */}
          <defs>
            <pattern id="campusGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="800" height="500" fill="url(#campusGrid)" />

          {/* Render All Zones */}
          {zones.map((z, idx) => {
            const isSelected = selectedZone?.id === z.id;
            const pointsString = z.polygonCoordinates
              .map((pt) => `${toSvgX(pt.lng)},${toSvgY(pt.lat)}`)
              .join(' ');

            return (
              <g key={z.id}>
                <polygon
                  points={pointsString}
                  fill={isSelected ? 'rgba(14, 165, 233, 0.25)' : 'rgba(51, 65, 85, 0.15)'}
                  stroke={isSelected ? '#38bdf8' : '#475569'}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  strokeDasharray={z.isActive ? 'none' : '4 4'}
                  className="transition-all duration-300 cursor-pointer hover:fill-sky-500/30"
                  onClick={() => setSelectedZone(z)}
                />

                {/* Draw vertex markers */}
                {z.polygonCoordinates.map((pt, pIdx) => (
                  <circle
                    key={pIdx}
                    cx={toSvgX(pt.lng)}
                    cy={toSvgY(pt.lat)}
                    r={isSelected ? 4.5 : 3}
                    fill={isSelected ? '#38bdf8' : '#64748b'}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                ))}
              </g>
            );
          })}

          {/* Important Campus Landmarks */}
          <g transform={`translate(${toSvgX(87.2931)}, ${toSvgY(23.5484)})`}>
            <circle r="6" fill="#f59e0b" className="animate-ping" opacity="0.4" />
            <circle r="5" fill="#f59e0b" />
            <text x="8" y="4" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
              Academic Complex & SAC
            </text>
          </g>

          <g transform={`translate(${toSvgX(87.2900)}, ${toSvgY(23.5510)})`}>
            <circle r="4" fill="#38bdf8" />
            <text x="8" y="4" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
              Halls 11, 12, 13, 14
            </text>
          </g>

          <g transform={`translate(${toSvgX(87.2940)}, ${toSvgY(23.5440)})`}>
            <circle r="4" fill="#38bdf8" />
            <text x="8" y="4" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
              Halls 1, 2, 3, 4, 5, 7, 8
            </text>
          </g>
        </svg>

        <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400">
          Center: 23.5484° N, 87.2931° E &bull; NIT Durgapur WGS84
        </div>
      </div>

      {/* Selected Zone Details & Control Panel */}
      {selectedZone && (
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-white text-sm">{selectedZone.name}</h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  selectedZone.isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {selectedZone.isActive ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> Active Delivery
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" /> Zone Paused
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Vertices: {selectedZone.polygonCoordinates.length} geo-coordinates &bull; Available Services:{' '}
              <span className="text-sky-300 font-mono text-[11px]">{selectedZone.availableServices}</span>
            </p>
          </div>

          {isAdmin && onUpdateZone && (
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onUpdateZone({
                    ...selectedZone,
                    isActive: !selectedZone.isActive,
                  })
                }
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg border border-slate-700"
              >
                {selectedZone.isActive ? 'Deactivate Zone' : 'Activate Zone'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
