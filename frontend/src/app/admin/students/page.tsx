'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../../lib/api';
import {
  Users,
  Search,
  Building2,
  Phone,
  Mail,
  ShoppingBag,
  Trash2,
  AlertTriangle,
  GraduationCap,
  Calendar,
  Wallet,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  XCircle,
  X,
  CheckCircle2
} from 'lucide-react';

interface StudentRecord {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  collegeEmail?: string;
  personalEmail?: string;
  phone: string;
  mobileNumber?: string;
  studentId: string;
  rollNumber?: string;
  registrationNumber?: string;
  registrationDate?: string;
  createdAt?: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  totalAmountSpent: number;
  walletBalance: number;
  accountStatus: string;
  isActive: boolean;
  lastActivity?: string;
  department?: string;
  programme?: string;
  year?: string;
  hallName?: string;
  roomNumber?: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 25
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [hallFilter, setHallFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // Deletion modal state
  const [studentToDelete, setStudentToDelete] = useState<StudentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (hallFilter !== 'ALL') params.append('hall', hallFilter);
      params.append('page', String(page));
      params.append('limit', '25');

      const res = await apiRequest(`/api/admin/students?${params.toString()}`);
      if (res.success) {
        setStudents(res.students || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        throw new Error(res.message || 'Failed to fetch student records');
      }
    } catch (err: any) {
      console.warn('Students fetch error:', err);
      setError(err.message || 'An unexpected error occurred while loading students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, statusFilter, hallFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleToggleStatus = async (studentId: string, currentActive: boolean) => {
    try {
      const res = await apiRequest(`/api/admin/students/${studentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentActive })
      });
      if (res.success) {
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, isActive: !currentActive, accountStatus: !currentActive ? 'ACTIVE' : 'SUSPENDED' } : s))
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
        setStudentToDelete(null);
        setActionMessage({
          type: 'success',
          text: `Student ${studentToDelete.fullName} (${studentToDelete.email}) permanently deleted.`
        });
      } else {
        throw new Error(res.message || 'Deletion failed');
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Error occurred while attempting to delete student record.'
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#17202A] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#4F9D32]" />
            <span>Students Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View and manage every real student/user registered with Campus Basket.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStudents()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#4F9D32]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-[#347A27]'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, roll number, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#4F9D32] cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="SUSPENDED">Suspended Only</option>
            </select>

            {/* Hall Filter */}
            <select
              value={hallFilter}
              onChange={(e) => {
                setHallFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#4F9D32] cursor-pointer"
            >
              <option value="ALL">All Residence Halls</option>
              <option value="Hall 1">Hall 1</option>
              <option value="Hall 2">Hall 2</option>
              <option value="Hall 3">Hall 3</option>
              <option value="Hall 4">Hall 4</option>
              <option value="Hall 5">Hall 5</option>
              <option value="Hall 6">Hall 6</option>
              <option value="Hall 7">Hall 7</option>
              <option value="Hall 8">Hall 8</option>
              <option value="Hall 9">Hall 9</option>
              <option value="Hall 10">Hall 10</option>
              <option value="Hall 11">Hall 11</option>
              <option value="Hall 12">Hall 12</option>
              <option value="Hall 13">Hall 13</option>
              <option value="Hall 14">Hall 14</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Students 14-Column Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-[#4F9D32]/30 border-t-[#4F9D32] rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Loading registered students...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-rose-500 text-xs px-4">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-rose-400" />
            <p className="font-bold">{error}</p>
            <button
              onClick={() => fetchStudents()}
              className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No registered students found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Student / User ID</th>
                  <th className="py-3.5 px-4">Registration Date</th>
                  <th className="py-3.5 px-4 text-center">Total Orders</th>
                  <th className="py-3.5 px-4 text-center">Completed</th>
                  <th className="py-3.5 px-4 text-center">Cancelled</th>
                  <th className="py-3.5 px-4 text-center">Returned</th>
                  <th className="py-3.5 px-4">Total Amount Spent</th>
                  <th className="py-3.5 px-4">Wallet Balance</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* 1. Student Name */}
                    <td className="py-3.5 px-4 font-bold text-[#17202A]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {s.fullName?.slice(0, 1) || 'S'}
                        </div>
                        <div>
                          <Link
                            href={`/admin/students/${s.id}`}
                            className="text-xs font-bold text-slate-900 hover:text-[#4F9D32] transition"
                          >
                            {s.fullName}
                          </Link>
                          {s.hallName && (
                            <div className="text-[10px] text-slate-400 font-normal">
                              {s.hallName} &bull; Room {s.roomNumber || '—'}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Email */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      <div>{s.email}</div>
                      {s.collegeEmail && s.collegeEmail !== s.email && (
                        <div className="text-[10px] text-slate-400">{s.collegeEmail}</div>
                      )}
                    </td>

                    {/* 3. Phone */}
                    <td className="py-3.5 px-4 font-mono text-slate-700 text-xs">
                      {s.phone || 'N/A'}
                    </td>

                    {/* 4. Student ID / User ID */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-slate-800">{s.studentId}</span>
                      {s.userId && (
                        <div className="text-[9px] text-slate-400 truncate max-w-[90px]">
                          UID: {s.userId.slice(-6)}
                        </div>
                      )}
                    </td>

                    {/* 5. Registration Date */}
                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      {s.registrationDate
                        ? new Date(s.registrationDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : '—'}
                    </td>

                    {/* 6. Total Orders */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                      {s.totalOrders}
                    </td>

                    {/* 7. Completed Orders */}
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-emerald-700">
                      {s.completedOrders}
                    </td>

                    {/* 8. Cancelled Orders */}
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-rose-600">
                      {s.cancelledOrders}
                    </td>

                    {/* 9. Returned Orders */}
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-amber-700">
                      {s.returnedOrders}
                    </td>

                    {/* 10. Total Amount Spent */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      ₹{s.totalAmountSpent.toLocaleString('en-IN')}
                    </td>

                    {/* 11. Wallet Balance */}
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      ₹{s.walletBalance.toLocaleString('en-IN')}
                    </td>

                    {/* 12. Account Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                          s.isActive
                            ? 'bg-emerald-50 text-[#347A27] border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {s.accountStatus || (s.isActive ? 'ACTIVE' : 'SUSPENDED')}
                      </span>
                    </td>

                    {/* 13. Last Activity */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {s.lastActivity
                        ? new Date(s.lastActivity).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : '—'}
                    </td>

                    {/* 14. Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/students/${s.id}`}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-[#4F9D32] hover:text-white text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                          title="View Student Details"
                        >
                          <span>Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>

                        <button
                          onClick={() => handleToggleStatus(s.id, s.isActive)}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg border transition cursor-pointer ${
                            s.isActive
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-[#347A27] border-emerald-200'
                          }`}
                        >
                          {s.isActive ? 'Suspend' : 'Activate'}
                        </button>

                        <button
                          onClick={() => setStudentToDelete(s)}
                          className="p-1 rounded-lg border bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 transition cursor-pointer"
                          title="Delete student account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && students.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing page <span className="font-bold text-slate-900">{pagination.page}</span> of{' '}
              <span className="font-bold text-slate-900">{pagination.totalPages}</span> ({pagination.total} total students)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Admin Student Deletion */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Student Account Deletion</h3>
                <p className="text-xs text-slate-500">This action permanently deletes the student record.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div>
                <span className="text-slate-500 font-medium">Name: </span>
                <span className="font-bold text-slate-900">{studentToDelete.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Email: </span>
                <span className="font-mono text-slate-800">{studentToDelete.email}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Roll Number: </span>
                <span className="font-mono text-slate-800">{studentToDelete.rollNumber || 'N/A'}</span>
              </div>
            </div>

            <p className="text-xs text-rose-600 font-medium">
              Warning: Deleting this account will release credentials for fresh student registration.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                disabled={deleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
