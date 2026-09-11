'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  ChevronRight,
  Truck,
  Store,
  Phone,
  MapPin,
  ExternalLink,
  Package,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface SupportTicket {
  id: string;
  ticketNumber?: string;
  orderId?: string;
  userId?: string;
  studentId?: string;
  category?: string;
  subject?: string;
  description?: string;
  message?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminResponse?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  student?: {
    id?: string;
    fullName?: string;
    rollNumber?: string;
    registrationNumber?: string;
    collegeEmail?: string;
    personalEmail?: string;
    mobileNumber?: string;
    hallName?: string;
    roomNumber?: string;
    department?: string;
  };
  user?: {
    name?: string;
    email?: string;
    phone?: string;
    hall?: { name?: string };
    roomNumber?: string;
  };
  order?: {
    id: string;
    orderNumber: string;
    serviceType: string;
    status: string;
    totalAmount: number;
    subtotal?: number;
    deliveryFee?: number;
    paymentMethod: string;
    paymentStatus: string;
    hallName?: string;
    roomNumber?: string;
    deliveryOtp?: string;
    createdAt?: string;
    items?: Array<{ name: string; quantity: number; unitPrice: number; totalPrice: number }>;
    trackingUrl?: string;
    customerTrackingUrl?: string;
  } | null;
  deliveryBoy?: {
    id: string;
    fullName: string;
    mobileNumber: string;
    vehicleType?: string;
    activeStatus?: string;
    currentZone?: string;
    paymentType?: string;
  } | null;
  provider?: {
    id: string;
    fullName: string;
    serviceCategory?: string;
    mobileNumber?: string;
    assignedZones?: string;
  } | null;
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
        setFeedbackMsg({ type: 'success', text: 'Grievance ticket updated & student notified' });
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
  const openTickets = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    const q = searchQuery.toLowerCase().trim();
    const studentName = (ticket.student?.fullName || ticket.user?.name || '').toLowerCase();
    const studentEmail = (ticket.student?.collegeEmail || ticket.user?.email || '').toLowerCase();
    const studentRoll = (ticket.student?.rollNumber || '').toLowerCase();
    const orderNum = (ticket.order?.orderNumber || '').toLowerCase();
    const runnerName = (ticket.deliveryBoy?.fullName || '').toLowerCase();
    const providerName = (ticket.provider?.fullName || '').toLowerCase();
    const subject = (ticket.subject || ticket.message || '').toLowerCase();
    const desc = (ticket.description || ticket.message || '').toLowerCase();
    const category = (ticket.category || '').toLowerCase();
    const ticketId = (ticket.ticketNumber || ticket.id || '').toLowerCase();

    const matchesSearch =
      !q ||
      studentName.includes(q) ||
      studentEmail.includes(q) ||
      studentRoll.includes(q) ||
      orderNum.includes(q) ||
      runnerName.includes(q) ||
      providerName.includes(q) ||
      subject.includes(q) ||
      desc.includes(q) ||
      category.includes(q) ||
      ticketId.includes(q);

    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-[#347A27] border-emerald-200';
      case 'CLOSED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[#4F9D32]">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#17202A] tracking-tight">Orders Grievance &amp; Help Desk</h1>
            <p className="text-xs text-slate-500">
              Authoritative resolution console for food, laundry, stationery, and essentials complaints across NIT Durgapur
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Open Tickets</span>
            <div className="mt-2 text-2xl font-bold text-blue-600 tracking-tight">{openTickets}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Awaiting immediate campus support</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">In Progress</span>
            <div className="mt-2 text-2xl font-bold text-amber-600 tracking-tight">{inProgressTickets}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Assigned / runner dispatched</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Resolved Grievances</span>
            <div className="mt-2 text-2xl font-bold text-[#347A27] tracking-tight">{resolvedTickets}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Settled with verified resolution</span>
          </div>
          <div className="p-3 bg-emerald-50 text-[#347A27] rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, student, runner, vendor, issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#4F9D32] cursor-pointer"
          >
            <option value="ALL">All Statuses ({tickets.length})</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
            <span>Priority:</span>
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
            <p className="text-xs text-slate-500 font-medium">Loading complaints &amp; orders...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-16 text-center">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-[#17202A] font-medium text-sm">No tickets found matching criteria</p>
            <p className="text-slate-400 text-xs mt-1">Try relaxing search terms or status filters</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((ticket) => {
              const displaySubject = ticket.subject || ticket.message || 'Support Grievance';
              const displayDesc = ticket.description || ticket.message || 'No description provided';
              const displayStatus = (ticket.status || 'OPEN').replace('_', ' ');
              const studentName = ticket.student?.fullName || ticket.user?.name || 'Sourav Senapati';
              const studentRoll = ticket.student?.rollNumber || '24U10227';
              const hallName = ticket.student?.hallName || ticket.user?.hall?.name || 'Hall 11';
              const ticketIdDisplay = ticket.ticketNumber || (ticket.id ? `#${String(ticket.id).slice(0, 8)}` : '#TICKET');

              return (
                <div
                  key={ticket.id || Math.random().toString()}
                  onClick={() => openTicketDetail(ticket)}
                  className="p-4 sm:p-5 hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-800">
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
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {ticket.category || 'ORDER'}
                      </span>

                      {/* Associated Order Badge */}
                      {ticket.order && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#347A27] border border-emerald-200 flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          #{ticket.order.orderNumber}
                        </span>
                      )}

                      {/* Runner Pill */}
                      {ticket.deliveryBoy && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          Runner: {ticket.deliveryBoy.fullName.split(' ')[0]}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-[#17202A] truncate group-hover:text-[#4F9D32] transition">
                      {displaySubject}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{displayDesc}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-slate-600">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        {studentName} ({studentRoll})
                      </span>
                      {hallName && (
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {hallName}
                        </span>
                      )}
                      <span className="flex items-center gap-1" suppressHydrationWarning>
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {mounted ? formatDate(ticket.createdAt) : 'Recently'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {ticket.order && (
                      <Link
                        href={`/admin/orders/${ticket.order.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#347A27] border border-emerald-200 text-xs font-bold transition flex items-center gap-1"
                        title="Track Order Live"
                      >
                        <Truck className="w-3 h-3" />
                        <span>Track</span>
                      </Link>
                    )}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-black text-slate-800 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                    {selectedTicket.ticketNumber || (selectedTicket.id ? `#${String(selectedTicket.id).slice(0, 8)}` : '#TICKET')}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(
                      selectedTicket.priority
                    )}`}
                  >
                    {selectedTicket.priority || 'MEDIUM'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                      selectedTicket.status
                    )}`}
                  >
                    {(selectedTicket.status || 'OPEN').replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                    {selectedTicket.category || 'ORDER'}
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#17202A] mt-1.5 tracking-tight">
                  {selectedTicket.subject || selectedTicket.message || 'Support Grievance'}
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
              {/* 1. ORDER SUMMARY & LIVE TRACKING BANNER */}
              {selectedTicket.order ? (
                <div className="p-4.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-blue-50/60 border border-emerald-200 space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="p-1.5 rounded-lg bg-[#4F9D32] text-white font-mono text-xs font-black flex items-center gap-1.5 shadow-xs">
                        <Package className="w-3.5 h-3.5" />
                        #{selectedTicket.order.orderNumber}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                        {selectedTicket.order.serviceType}
                      </span>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                        {selectedTicket.order.status}
                      </span>
                    </div>

                    {/* LIVE TRACK ORDER BUTTON */}
                    <Link
                      href={`/admin/orders/${selectedTicket.order.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#4F9D32] hover:bg-[#347A27] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer self-start sm:self-auto"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Track Order Live</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </Link>
                  </div>

                  {/* Order Metadata Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-emerald-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Order Amount</span>
                      <span className="font-extrabold text-[#17202A] font-mono text-sm">
                        ₹{Number(selectedTicket.order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Payment</span>
                      <span className="font-bold text-slate-800">
                        {selectedTicket.order.paymentMethod}
                      </span>
                      <span className="text-[10px] text-slate-400 block">({selectedTicket.order.paymentStatus})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Delivery Room</span>
                      <span className="font-semibold text-slate-800">
                        Room {selectedTicket.order.roomNumber}, {selectedTicket.order.hallName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Order Time</span>
                      <span className="font-mono text-slate-600 text-[11px] block">
                        {formatDate(selectedTicket.order.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  {selectedTicket.order.items && selectedTicket.order.items.length > 0 && (
                    <div className="pt-2 border-t border-emerald-100/70">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                        Items Ordered ({selectedTicket.order.items.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTicket.order.items.map((it, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 shadow-2xs"
                          >
                            {it.quantity}x {it.name}
                            {it.unitPrice > 0 && (
                              <span className="text-slate-400 font-mono ml-1 font-normal">(₹{it.unitPrice})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>General Support Ticket — No specific order linked to this grievance</span>
                </div>
              )}

              {/* 2. THREE COMPREHENSIVE CARDS: STUDENT, RUNNER, PROVIDER */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* A. STUDENT CARD */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block font-black text-xs text-[#17202A] truncate">
                        {selectedTicket.student?.fullName || selectedTicket.user?.name || 'Sourav Senapati'}
                      </span>
                      <span className="text-[10px] text-blue-600 font-mono font-bold">
                        Roll: {selectedTicket.student?.rollNumber || '24U10227'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-0.5">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a
                        href={`mailto:${selectedTicket.student?.collegeEmail || selectedTicket.user?.email}`}
                        className="text-blue-600 hover:underline truncate text-[11px] font-semibold"
                        title="Click to Email Student"
                      >
                        {selectedTicket.student?.collegeEmail || selectedTicket.user?.email || 'ss.24u10227@nitdgp.ac.in'}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a
                        href={`tel:${selectedTicket.student?.mobileNumber || selectedTicket.user?.phone}`}
                        className="text-slate-800 font-mono text-[11px] font-semibold hover:underline"
                        title="Click to Call Student"
                      >
                        {selectedTicket.student?.mobileNumber || selectedTicket.user?.phone || '+91 98765 01234'}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-medium truncate">
                        {selectedTicket.student?.hallName || selectedTicket.user?.hall?.name || 'Hall 11'} (Room {selectedTicket.student?.roomNumber || selectedTicket.user?.roomNumber || 'B-304'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* B. DELIVERY RUNNER CARD */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block font-black text-xs text-[#17202A] truncate">
                        {selectedTicket.deliveryBoy?.fullName || 'No Runner Assigned'}
                      </span>
                      <span className={`text-[10px] font-bold ${selectedTicket.deliveryBoy ? 'text-amber-700' : 'text-slate-400'}`}>
                        {selectedTicket.deliveryBoy?.activeStatus || 'Unassigned Runner'}
                      </span>
                    </div>
                  </div>

                  {selectedTicket.deliveryBoy ? (
                    <div className="space-y-1.5 text-xs text-slate-600 pt-0.5">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a
                          href={`tel:${selectedTicket.deliveryBoy.mobileNumber}`}
                          className="text-slate-800 font-mono text-[11px] font-semibold hover:underline"
                          title="Click to Call Delivery Boy"
                        >
                          {selectedTicket.deliveryBoy.mobileNumber}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px] font-medium truncate">
                          Vehicle: {selectedTicket.deliveryBoy.vehicleType || 'Bicycle / Walk'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[11px] font-semibold text-emerald-700 truncate">
                          Zone: {selectedTicket.deliveryBoy.currentZone || 'Campus Central'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2.5 text-center text-[11px] text-slate-400 italic">
                      No delivery runner assigned to this order yet.
                    </div>
                  )}
                </div>

                {/* C. PROVIDER / MERCHANT CARD */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                    <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                      <Store className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block font-black text-xs text-[#17202A] truncate">
                        {selectedTicket.provider?.fullName || 'Campus Food & Cafeteria Vendor'}
                      </span>
                      <span className="text-[10px] text-purple-600 font-bold">
                        {selectedTicket.provider?.serviceCategory || selectedTicket.category || 'Food & Dining'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-0.5">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a
                        href={`tel:${selectedTicket.provider?.mobileNumber}`}
                        className="text-slate-800 font-mono text-[11px] font-semibold hover:underline"
                        title="Click to Call Vendor"
                      >
                        {selectedTicket.provider?.mobileNumber || '+91 98765 43211'}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-medium truncate">
                        Coverage: {selectedTicket.provider?.assignedZones || 'All NIT Durgapur Hostels'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-semibold text-slate-700">
                        Service: {selectedTicket.category || 'FOOD'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. STUDENT GRIEVANCE MESSAGE */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Official Grievance Description
                </label>
                <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedTicket.description || selectedTicket.message || 'No description provided'}
                </div>
              </div>

              {/* 4. ADMIN RESOLUTION & REPLY FORM */}
              <form onSubmit={handleReplyAndStatusUpdate} className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Official Admin Resolution &amp; Status Update
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Status:</span>
                    <select
                      value={newStatus}
                      onChange={(e: any) => setNewStatus(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#17202A] font-bold focus:outline-none focus:border-[#4F9D32] cursor-pointer"
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
                  placeholder="Type resolution statement, refund reference, runner warning details, or update for the student..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition resize-none leading-relaxed"
                />

                {feedbackMsg && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-semibold ${
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
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={savingResponse}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4F9D32] hover:bg-[#347A27] text-white font-black text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
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
