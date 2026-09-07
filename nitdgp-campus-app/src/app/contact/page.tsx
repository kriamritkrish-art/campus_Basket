'use client';

import React, { useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const { user, isAuthenticated } = useAuth();
  const [category, setCategory] = useState('OTHER');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = '/login?redirect=/contact';
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await apiRequest('/api/campus/support/tickets', {
        method: 'POST',
        body: JSON.stringify({ category, message, priority: 'MEDIUM' }),
      });

      if (res.success) {
        setStatus(`Ticket ${res.ticket?.ticketNumber || ''} created. Helpdesk will contact you.`);
        setMessage('');
      } else {
        setStatus(res.message || 'Failed to submit ticket.');
      }
    } catch (err: any) {
      setStatus(err.message || 'Submission error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Campus Helpdesk</span>
        <h1 className="text-3xl font-extrabold text-white">Student Support &amp; Assistance</h1>
        <p className="text-xs text-slate-400">
          Reach the Student Services Cell, report delivery issues, or ask about laundry queries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 text-xs text-slate-300">
          <h3 className="font-bold text-white text-base">Campus Helpdesk Details</h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Physical Helpdesk</strong>
                <p className="text-slate-400 mt-0.5">Student Activity Centre (SAC), Ground Floor, NIT Durgapur</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-sky-400 flex-shrink-0" />
              <div>
                <strong className="text-white">Support Email</strong>
                <p className="text-slate-400 mt-0.5">services@nitdgp.ac.in</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-sky-400 flex-shrink-0" />
              <div>
                <strong className="text-white">Campus Exchange Helpline</strong>
                <p className="text-slate-400 mt-0.5">+91 343 275 4000 &bull; Ext: 2244</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Ticket Form */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-base">Submit Support Ticket</h3>

          {status && (
            <div className="p-3 bg-sky-950/60 border border-sky-800 text-xs text-sky-300 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{status}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Issue Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="FOOD">Food / Meal Delivery</option>
                <option value="LAUNDRY">Laundry Pickup or Return</option>
                <option value="PAYMENT">Payment &amp; Refund</option>
                <option value="ACCOUNT">Student Account</option>
                <option value="OTHER">Other Query</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Describe Your Issue</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mention order number or detailed description..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> {loading ? 'Submitting...' : 'Dispatch Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
