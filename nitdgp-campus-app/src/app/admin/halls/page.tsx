'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Building2, Plus, CheckCircle, Users } from 'lucide-react';

export default function AdminHallsPage() {
  const [halls, setHalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Hall Form
  const [name, setName] = useState('');
  const [hallNumber, setHallNumber] = useState('');
  const [instructions, setInstructions] = useState('Delivery at Security Desk / Common Room');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchHalls = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/admin/halls');
      if (res.success && res.halls) {
        setHalls(res.halls);
      }
    } catch (err) {
      console.warn('Halls error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHalls();
  }, []);

  const handleAddHall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !hallNumber) return;
    setIsSubmitting(true);

    try {
      const res = await apiRequest('/api/admin/halls', {
        method: 'POST',
        body: JSON.stringify({
          name,
          hallNumber,
          deliveryInstructions: instructions
        })
      });

      if (res.success) {
        setName('');
        setHallNumber('');
        fetchHalls();
      }
    } catch (err) {
      alert('Error adding hall');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#17202A] flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#4F9D32]" />
          <span>Residence Halls &amp; Hostels</span>
          <span className="text-[10px] bg-[#4F9D32]/10 text-[#347A27] font-bold px-2.5 py-0.5 rounded-full border border-[#4F9D32]/20">
            {halls.length} Registered
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          NIT Durgapur student hostels, drop-off gate instructions &amp; room distributions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Register Hall Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#4F9D32]" />
            <span>Register Residence Hall</span>
          </h3>

          <form onSubmit={handleAddHall} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Hall Official Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Hall of Residence 11 (Dr. B.C. Roy)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Hall Code / Number *
              </label>
              <input
                type="text"
                placeholder="e.g. Hall 11"
                value={hallNumber}
                onChange={(e) => setHallNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Courier Drop Protocol
              </label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs rounded-xl shadow-sm shadow-[#4F9D32]/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Register Hall'}</span>
            </button>
          </form>
        </div>

        {/* Halls Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Hostel Directory
            </span>
            <span className="text-xs text-slate-500 font-mono">{halls.length} buildings</span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-[#4F9D32]/30 border-t-[#4F9D32] rounded-full animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Loading halls...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Hall Name</th>
                    <th className="py-3 px-4">Service Zone</th>
                    <th className="py-3 px-4">Drop Instructions</th>
                    <th className="py-3 px-4">Students</th>
                    <th className="py-3 px-4">Serviceability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {halls.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#17202A]">{h.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{h.hallNumber}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                          {h.zoneName || 'Campus Main Zone'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-xs line-clamp-1">
                        {h.deliveryInstructions}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-[#17202A]">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          {h.studentCount || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#347A27] border border-emerald-200">
                          SERVICEABLE
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
    </div>
  );
}
