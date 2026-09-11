'use client';

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  User,
  Send,
  X,
  RefreshCw,
  Tag,
  Building,
  Mail,
  ChevronRight
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface SupportTicket {
  id: string;
  ticketNumber?: string;
  userId?: string;
  studentId?: string;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
    hall?: { name?: string };
    roomNumber?: string;
  };
  student?: {
    fullName?: string;
    collegeEmail?: string;
    mobileNumber?: string;
  };
  category?: string;
  subject?: string;
  description?: string;
  message?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminResponse?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export default function AdminSupportTicketsPage() {
  const [mounted, setMounted] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState<'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('RESOLVED');
  const [savingResponse, setSavingResponse] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/admin/support/tickets');
      if (res && res.success && Array.isArray(res.tickets)) {
        setTickets(res.tickets);
      } else if (Array.isArray(res)) {
        setTickets(res);
      } else {
        setTickets([]);
      }
    } catch (err: any) {
      console.error('Failed to load tickets', err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchTickets();
  }, []);

  const openTicketDetail = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setResponseText(ticket.adminResponse || '');
    setNewStatus(ticket.status || 'RESOLVED');
    setFeedbackMsg(null);
  };

  const handleReplyAndStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      setSavingResponse(true);
      setFeedbackMsg(null);

      const res = await apiRequest(`/api/admin/support/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          adminResponse: responseText
        })
      });

      if (res && res.success) {
        setFeedbackMsg({ type: 'success', text: 'Ticket updated and student notified' });
        const updatedList = tickets.map((t) =>
          t.id === selectedTicket.id
            ? { ...t, status: newStatus, adminResponse: responseText }
            : t
        );
        setTickets(updatedList);
        setSelectedTicket({
          ...selectedTicket,
          status: newStatus,
          adminResponse: responseText
        });
      } else {
        setFeedbackMsg({ type: 'error', text: res?.message || 'Failed to update ticket' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to update ticket' });
    } finally {
      setSavingResponse(false);
    }
  };

  const formatDate = (dateValue?: string | Date) => {
    if (!dateValue) return 'Recently';
    try {
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recently';
    }
  };

  // Metrics
  const totalCount = Array.isArray(tickets) ? tickets.length : 0;
  const openCount = Array.isArray(tickets) ? tickets.filter((t) => t && (t.status === 'OPEN' || t.status === 'IN_PROGRESS')).length : 0;
  const urgentCount = Array.isArray(tickets) ? tickets.filter((t) => t && (t.priority === 'URGENT' || t.priority === 'HIGH')).length : 0;
  const resolvedCount = Array.isArray(tickets) ? tickets.filter((t) => t && (t.status === 'RESOLVED' || t.status === 'CLOSED')).length : 0;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  // Filtered tickets
  const filteredTickets = (Array.isArray(tickets) ? tickets : []).filter((ticket) => {
    if (!ticket) return false;
    const q = (searchQuery || '').toLowerCase().trim();
    const subject = (ticket.subject || ticket.message || '').toLowerCase();
    const desc = (ticket.description || ticket.message || '').toLowerCase();
    const userName = (ticket.user?.name || ticket.student?.fullName || '').toLowerCase();
    const userEmail = (ticket.user?.email || ticket.student?.collegeEmail || '').toLowerCase();
    const tNum = (ticket.ticketNumber || ticket.id || '').toLowerCase();
    const category = (ticket.category || '').toLowerCase();

    const matchesSearch =
      !q ||
      subject.includes(q) ||
      desc.includes(q) ||
      userName.includes(q) ||
      userEmail.includes(q) ||
      tNum.includes(q) ||
      category.includes(q);

    const matchesStatus = statusFilter === 'ALL' || (ticket.status || 'OPEN') === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || (ticket.priority || 'MEDIUM') === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-[#347A27] border-emerald-200';
      case 'CLOSED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#17202A] tracking-tight">Support Tickets &amp; Grievances</h1>
            <p className="text-xs text-slate-500">
              Manage student inquiries, order escalations, delivery disputes, and laundry service reports
            </p>
          </div>
        </div>

        <button
          onClick={fetchTickets}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#4F9D32]' : ''}`} />
          Refresh Tickets
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Tickets</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#17202A] tracking-tight">{totalCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Institutional lifetime queries</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pending Action</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-600 tracking-tight">{openCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting admin review or response</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">High / Urgent</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-600 tracking-tight">{urgentCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Priority student escalations</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Resolution Rate</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#347A27] border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#347A27] tracking-tight">{resolutionRate}%</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{resolvedCount} resolved of {totalCount} total</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets, student, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#4F9D32] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#4F9D32] cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-[#4F9D32] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading support tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-16 text-center">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-[#17202A] font-medium text-sm">No tickets found matching your criteria</p>
            <p className="text-slate-400 text-xs mt-1">Try relaxing search terms or status filters</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((ticket) => {
              const displaySubject = ticket.subject || ticket.message || 'Support Request';
              const displayDesc = ticket.description || ticket.message || 'No description provided';
              const displayStatus = (ticket.status || 'OPEN').replace('_', ' ');
              const studentName = ticket.user?.name || ticket.student?.fullName || 'Campus Student';
              const hallName = ticket.user?.hall?.name || 'Campus Hostel';
              const ticketIdDisplay = ticket.ticketNumber || (ticket.id ? `#${String(ticket.id).slice(0, 8)}` : '#TICKET');

              return (
                <div
                  key={ticket.id || Math.random().toString()}
                  onClick={() => openTicketDetail(ticket)}
                  className="p-4 sm:p-5 hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {ticketIdDisplay}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority || 'MEDIUM'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                          ticket.status
                        )}`}
                      >
                        {displayStatus}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {ticket.category || 'GENERAL'}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-[#17202A] truncate group-hover:text-[#4F9D32] transition">
                      {displaySubject}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{displayDesc}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {studentName}
                      </span>
                      {hallName && (
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          {hallName}
                        </span>
                      )}
                      <span className="flex items-center gap-1" suppressHydrationWarning>
                        <Clock className="w-3 h-3 text-slate-400" />
                        {mounted ? formatDate(ticket.createdAt) : 'Recently'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {ticket.adminResponse && (
                      <span className="text-[11px] text-[#347A27] flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Replied
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#17202A] transition" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket Details & Resolution Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {selectedTicket.ticketNumber || (selectedTicket.id ? `#${String(selectedTicket.id).slice(0, 8)}` : '#TICKET')}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(
                      selectedTicket.priority
                    )}`}
                  >
                    {selectedTicket.priority || 'MEDIUM'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#17202A] mt-1">
                  {selectedTicket.subject || selectedTicket.message || 'Support Ticket'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Student Metadata Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-slate-500">Student:</span>
                  <span className="font-semibold text-[#17202A]">
                    {selectedTicket.user?.name || selectedTicket.student?.fullName || 'Campus Student'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-600" />
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-[#17202A]">
                    {selectedTicket.user?.email || selectedTicket.student?.collegeEmail || 'student@nitdgp.ac.in'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-600" />
                  <span className="text-slate-500">Residence Hall:</span>
                  <span className="font-semibold text-[#17202A]">
                    {selectedTicket.user?.hall?.name || 'Campus Hostel'} (Room: {selectedTicket.user?.roomNumber || 'Assigned'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#4F9D32]" />
                  <span className="text-slate-500">Category:</span>
                  <span className="font-semibold text-[#17202A]">{selectedTicket.category || 'GENERAL'}</span>
                </div>
              </div>

              {/* Student Grievance Message */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Grievance Description
                </label>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.description || selectedTicket.message || 'No description provided'}
                </div>
              </div>

              {/* Response Form */}
              <form onSubmit={handleReplyAndStatusUpdate} className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Official Admin Resolution / Reply
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Update Status:</span>
                    <select
                      value={newStatus}
                      onChange={(e: any) => setNewStatus(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-[#17202A] focus:outline-none focus:border-[#4F9D32] cursor-pointer"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Provide resolution details, refund reference, or laundry delivery update..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition resize-none"
                />

                {feedbackMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      feedbackMsg.type === 'success'
                        ? 'bg-emerald-50 text-[#347A27] border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {feedbackMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{feedbackMsg.text}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingResponse}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {savingResponse ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Save &amp; Dispatch Resolution
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
