'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import {
  Users,
  Search,
  Building2,
  Mail,
  ShoppingBag,
  Shirt,
  Trash2,
  AlertTriangle,
  GraduationCap,
  CheckCircle2,
  XCircle,
  X
} from 'lucide-react';

interface StudentRecord {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  collegeEmail?: string;
  personalEmail?: string;
  department?: string;
  programme?: string;
  year?: string;
  rollNumber: string;
  registrationNumber?: string;
  mobileNumber?: string;
  hallName?: string;
  roomNumber?: string;
  isActive: boolean;
  isVerified?: boolean;
  totalOrders?: number;
  totalLaundryOrders?: number;
  createdAt?: string;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hallFilter, setHallFilter] = useState('ALL');

  // Deletion state
  const [studentToDelete, setStudentToDelete] = useState<StudentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        setActionMessage({
          type: 'success',
          text: `Student account status updated to ${!currentActive ? 'Active' : 'Suspended'}.`
        });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Error updating student account status.' });
    }
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    setDeleting(true);
    setActionMessage(null);

    try {
      const res = await apiRequest(`/api/admin/students/${studentToDelete.id}`, {
        method: 'DELETE'
      });

      if (res.success) {
        setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));
        setActionMessage({
          type: 'success',
          text: `Account for ${studentToDelete.fullName} successfully deleted. All constraints released for fresh registration.`
        });
        setStudentToDelete(null);
      } else {
        setActionMessage({
          type: 'error',
          text: res.message || 'Failed to delete student account.'
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Error executing student account deletion.'
      });
    } finally {
      setDeleting(false);
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
            Registered NIT Durgapur students, dual verified emails, academic details, and account lifecycle management
          </p>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border text-xs font-medium animate-fade-in ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            placeholder="Search by student name, roll number, college email, or personal email..."
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
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No students found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student &amp; Verified Emails</th>
                  <th className="py-3 px-4">Roll &amp; Academics</th>
                  <th className="py-3 px-4">Hostel &amp; Room</th>
                  <th className="py-3 px-4">Activity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Student & Dual Emails */}
                    <td className="py-3.5 px-4 font-bold text-[#17202A]">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          {s.fullName?.slice(0, 1) || 'S'}
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-slate-900">{s.fullName}</div>
                          {/* College Email */}
                          <div className="text-[11px] text-sky-700 font-normal flex items-center gap-1 font-mono bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 w-fit">
                            <span className="font-semibold text-[9px] uppercase text-sky-600">College:</span>
                            {s.collegeEmail || s.email}
                          </div>
                          {/* Personal Email */}
                          {s.personalEmail && (
                            <div className="text-[11px] text-emerald-700 font-normal flex items-center gap-1 font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 w-fit">
                              <span className="font-semibold text-[9px] uppercase text-emerald-600">Personal:</span>
                              {s.personalEmail}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Roll & Academic Details */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-slate-800">{s.rollNumber || 'N/A'}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {s.programme || 'B.Tech'} &bull; {s.year || '1st Year'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {s.department || 'Engineering'}
                        </div>
                      </div>
                    </td>

                    {/* Hostel & Room */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <div>
                          <div className="font-semibold">{s.hallName || 'Hostel'}</div>
                          <div className="text-[11px] text-slate-500">Room {s.roomNumber || 'Assigned'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Activity (Orders / Laundry) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 font-mono">
                        <span className="flex items-center gap-1 font-bold text-[#17202A]" title="Marketplace Orders">
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                          {s.totalOrders || 0}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500 text-[11px]" title="Laundry Orders">
                          <Shirt className="w-3.5 h-3.5 text-slate-400" />
                          {s.totalLaundryOrders || 0}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                          s.isActive
                            ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {s.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>

                    {/* Actions: Suspend/Activate & Delete Account */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(s.id, s.isActive)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                            s.isActive
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-[#347A27] border-emerald-200'
                          }`}
                        >
                          {s.isActive ? 'Suspend' : 'Activate'}
                        </button>

                        <button
                          onClick={() => setStudentToDelete(s)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg border bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 transition cursor-pointer flex items-center gap-1"
                          title="Permanently delete student account and release credentials for fresh registration"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Admin Student Deletion */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Delete Student Account &amp; Release Credentials
                </h3>
                <p className="text-xs text-slate-500">
                  This action is permanent and enables fresh student registration.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700">
              <p>
                Are you sure you want to permanently delete the account for:
              </p>
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 font-mono">
                <div><span className="text-slate-400">Name:</span> <strong className="text-slate-900">{studentToDelete.fullName}</strong></div>
                <div><span className="text-slate-400">Roll No:</span> <strong className="text-slate-900">{studentToDelete.rollNumber}</strong></div>
                <div><span className="text-slate-400">College Email:</span> <strong className="text-sky-700">{studentToDelete.collegeEmail || studentToDelete.email}</strong></div>
                {studentToDelete.personalEmail && (
                  <div><span className="text-slate-400">Personal Email:</span> <strong className="text-emerald-700">{studentToDelete.personalEmail}</strong></div>
                )}
              </div>
              <p className="text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px]">
                <strong>Notice:</strong> Once deleted, all unique constraints on both email addresses and the roll number are released. The student will be allowed to complete a fresh registration as if they are a new user.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteStudent}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
