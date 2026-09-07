'use client';

import React, { useState } from 'react';
import { useDelivery } from '@/context/DeliveryContext';
import {
  LifeBuoy,
  Phone,
  AlertTriangle,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Send,
  HelpCircle,
} from 'lucide-react';

export default function DeliverySupportPage() {
  const { activeOrder, setSuccessToast } = useDelivery();
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const commonIssues = [
    {
      id: 'pickup_problem',
      title: 'Pickup Problem',
      desc: 'Canteen item delayed, canteen closed, or food not prepared.',
    },
    {
      id: 'student_unavailable',
      title: 'Student Unavailable',
      desc: 'Student not answering call at hostel gate / room locked.',
    },
    {
      id: 'wrong_location',
      title: 'Wrong Location / Hall',
      desc: 'Hostel address mismatch or student entered incorrect room.',
    },
    {
      id: 'order_missing',
      title: 'Order Missing / Packaging Leak',
      desc: 'Container spill or missing item from cafeteria counter.',
    },
    {
      id: 'navigation_issue',
      title: 'Navigation / Campus Gate Issue',
      desc: 'Security gate closed or academic road detour blocked.',
    },
    {
      id: 'payment_issue',
      title: 'Payment / Payout Issue',
      desc: 'Discrepancy in order delivery fee or daily target bonus credit.',
    },
    {
      id: 'technical_issue',
      title: 'Technical / App Issue',
      desc: 'App freeze, OTP verification failure, or location GPS error.',
    },
  ];

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    setSubmitted(true);
    setSuccessToast('Ticket #TKT-8492 submitted. Campus Support will call your phone in < 2 mins.');
    setTimeout(() => {
      setSelectedIssue(null);
      setIssueDescription('');
      setSubmitted(false);
    }, 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-[#36751F]" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Campus Runner Help & Support
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Instant dispatch assistance, student escalations, and 24/7 campus runner hotline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="tel:+919876543210"
            className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 transition flex items-center gap-2 shadow-sm"
          >
            <Phone className="w-4 h-4" />
            <span>Campus SOS: 1800-NITD-RUN</span>
          </a>
        </div>
      </div>

      {/* For Active Order: Quick Escalation Banner (Section 20) */}
      {activeOrder && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-amber-900">
                  NEED HELP WITH THIS DELIVERY?
                </span>
                <span className="font-mono text-xs font-bold text-gray-900">
                  {activeOrder.orderNumber}
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Destination: {activeOrder.destination} • Student: {activeOrder.studentName} ({activeOrder.studentPhone})
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedIssue('student_unavailable');
              setIssueDescription(`Help with active order ${activeOrder.orderNumber} to ${activeOrder.destination}`);
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition shadow-xs self-start sm:self-auto flex items-center gap-1.5"
          >
            <span>Get Help With This Delivery</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Common Issues Selection (Section 20) */}
      <div className="card p-6 bg-white space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">
          Select Common Runner Issue
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {commonIssues.map((issue) => (
            <button
              key={issue.id}
              onClick={() => setSelectedIssue(issue.id)}
              className={`p-3.5 rounded-xl border text-left transition flex items-start justify-between gap-3 ${
                selectedIssue === issue.id
                  ? 'border-[#4F9D2F] bg-emerald-50/50 ring-2 ring-emerald-200'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-gray-900">{issue.title}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{issue.desc}</div>
              </div>
              <span
                className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center ${
                  selectedIssue === issue.id
                    ? 'border-[#4F9D2F] bg-[#4F9D2F] text-white'
                    : 'border-gray-300'
                }`}
              >
                {selectedIssue === issue.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            </button>
          ))}
        </div>

        {/* Selected Issue Submission Form */}
        {selectedIssue && (
          <form
            onSubmit={handleSubmitTicket}
            className="mt-6 pt-5 border-t border-gray-100 space-y-3 animate-in fade-in"
          >
            <label className="text-xs font-bold text-gray-800 block">
              Additional Details for Dispatch Team:
            </label>
            <textarea
              rows={3}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Provide specific notes (e.g. canteen kitchen queue delay, student phone unreachable)..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4F9D2F] focus:bg-white"
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setSelectedIssue(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs px-5 py-2.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Contact Campus Support</span>
              </button>
            </div>
          </form>
        )}

        {submitted && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Support request logged. Shift supervisor will contact you immediately.</span>
          </div>
        )}
      </div>

      {/* Emergency Hotline Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5 bg-white space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Campus Control Room</span>
          </div>
          <p className="text-xs text-gray-500">
            Available 24/7 for road security, gate entry issues, and medical emergency assistance.
          </p>
          <div className="text-xs font-mono font-bold text-gray-900 pt-1">
            Ext: +91 343 275 4000
          </div>
        </div>

        <div className="card p-5 bg-white space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Partner WhatsApp Desk</span>
          </div>
          <p className="text-xs text-gray-500">
            Chat directly with partner management for shift swap or thermal bag replacement.
          </p>
          <div className="text-xs font-mono font-bold text-gray-900 pt-1">
            WhatsApp: +91 94321 00000
          </div>
        </div>
      </div>
    </div>
  );
}
