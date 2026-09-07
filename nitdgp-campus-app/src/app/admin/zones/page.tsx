'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { CampusZoneMap } from '../../../components/maps/CampusZoneMap';
import { MapPin, Plus, CheckCircle, ShieldCheck } from 'lucide-react';

export default function AdminZonesPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Zone Form
  const [name, setName] = useState('');
  const [services, setServices] = useState('["FOOD","FRUITS","LAUNDRY","ESSENTIALS"]');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/admin/zones');
      if (res.success && res.zones) {
        setZones(res.zones);
      }
    } catch (err) {
      console.warn('Zones error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsSubmitting(true);

    try {
      const defaultPolygon = [
        { lat: 23.545, lng: 87.29 },
        { lat: 23.55, lng: 87.295 },
        { lat: 23.548, lng: 87.3 },
        { lat: 23.543, lng: 87.293 }
      ];

      const res = await apiRequest('/api/admin/zones', {
        method: 'POST',
        body: JSON.stringify({
          name,
          polygonCoordinates: defaultPolygon,
          availableServices: services
        })
      });

      if (res.success) {
        setName('');
        fetchZones();
      }
    } catch (err) {
      alert('Error creating zone');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#17202A] flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#4F9D32]" />
          <span>Campus Service Zones &amp; Geofencing</span>
          <span className="text-[10px] bg-[#4F9D32]/10 text-[#347A27] font-bold px-2.5 py-0.5 rounded-full border border-[#4F9D32]/20">
            {zones.length} Boundaries
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          NIT Durgapur GPS boundary coordinates, serviceable hostel quadrants &amp; delivery restrictions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Zone Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#4F9D32]" />
            <span>Create Geofenced Zone</span>
          </h3>

          <form onSubmit={handleCreateZone} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Zone Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Hall 11 &amp; PG Hostel Perimeter"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Permitted Services (JSON Array)
              </label>
              <input
                type="text"
                value={services}
                onChange={(e) => setServices(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#17202A] font-mono focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
              />
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[#347A27] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Geofencing auto-locks orders placed outside perimeter</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs rounded-xl shadow-sm shadow-[#4F9D32]/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Register Perimeter'}</span>
            </button>
          </form>
        </div>

        {/* Zones Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Geofence Boundaries
            </span>
            <span className="text-xs text-slate-500 font-mono">{zones.length} zones</span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-[#4F9D32]/30 border-t-[#4F9D32] rounded-full animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Loading geofence boundaries...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Zone Identifier</th>
                    <th className="py-3 px-4">Halls Covered</th>
                    <th className="py-3 px-4">Services Allowed</th>
                    <th className="py-3 px-4">Boundary Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {zones.map((z) => (
                    <tr key={z.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#17202A]">{z.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {z.id.slice(0, 12)}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-[#17202A]">
                        {z.hallCount || 4} halls
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(z.availableServices || ['FOOD', 'FRUITS', 'LAUNDRY', 'ESSENTIALS']).map((s: string) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#347A27] border border-emerald-200">
                          ENFORCED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Map Visualizer */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#4F9D32]" />
          <span>Campus Geofence Visualizer</span>
        </h3>
        <CampusZoneMap zones={zones || []} isAdmin={true} />
      </div>
    </div>
  );
}
