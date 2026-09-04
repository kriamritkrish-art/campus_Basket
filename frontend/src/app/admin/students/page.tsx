'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import {
  Users,
  Search,
  CheckCircle,
  Building2,
  Mail,
  ShoppingBag,
  Shirt
} from 'lucide-react';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hallFilter, setHallFilter] = useState('ALL');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let q = '/api/admin/students';
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (hallFilter !== 'ALL') params.append('hall', hallFilter);
      if (params.toString()) q += `?${params.toString()}`;

      const res = await apiRequest(q);
      if (res.success && res.students) {
        setStudents(res.students);
      }
    } catch (err) {
      console.warn('Students fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [hallFilter]);

  const handleToggleStatus = async (studentId: string, currentActive: boolean) => {
    try {
      const res = await apiRequest(`/api/admin/students/${studentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentActive })
      });
      if (res.success) {
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, isActive: !currentActive } : s))
        );
      }
    } catch (err) {
      alert('Error updating student status');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#17202A] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#4F9D32]" />
            <span>Students &amp; Residence Records</span>
            <span className="text-[10px] bg-[#4F9D32]/10 text-[#347A27] font-bold px-2.5 py-0.5 rounded-full border border-[#4F9D32]/20">
              {students.length} Enrolled
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered campus students, hostel room assignments &amp; transaction histories
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchStudents();
          }}
          className="relative flex-1 w-full"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name, roll number, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
          />
        </form>

        <select
          value={hallFilter}
          onChange={(e) => setHallFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#4F9D32]"
        >
          <option value="ALL">All Residence Halls</option>
          <option value="Hall 1">Hall 1</option>
          <option value="Hall 2">Hall 2</option>
          <option value="Hall 3">Hall 3</option>
          <option value="Hall 7">Hall 7</option>
          <option value="Hall 10">Hall 10</option>
          <option value="Hall 11">Hall 11</option>
          <option value="Hall 14">Hall 14</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-[#4F9D32]/30 border-t-[#4F9D32] rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Loading student directory...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Hostel &amp; Room</th>
                  <th className="py-3 px-4">Orders Placed</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#17202A]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                          {s.fullName?.slice(0, 1) || 'S'}
                        </div>
                        <div>
                          <div>{s.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-normal flex items-center gap-1 font-mono">
                            <Mail className="w-3 h-3" />
                            {s.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {s.rollNumber || 'N/A'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.hallName || 'Hostel'} &bull; Room {s.roomNumber || 'Assigned'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 font-mono">
                        <span className="flex items-center gap-1 font-bold text-[#17202A]">
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                          {s.orderCount || 0}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <Shirt className="w-3.5 h-3.5 text-slate-400" />
                          {s.laundryCount || 0}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          s.isActive
                            ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {s.isActive ? 'VERIFIED ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(s.id, s.isActive)}
                        className={`text-xs font-semibold px-3 py-1 rounded-lg border transition ${
                          s.isActive
                            ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-[#347A27] border-emerald-200'
                        }`}
                      >
                        {s.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
