'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { Tag, Megaphone, Plus, CheckCircle, Trash2 } from 'lucide-react';

export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState<'COUPONS' | 'ANNOUNCEMENTS'>('COUPONS');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New coupon form
  const [code, setCode] = useState('');
  const [desc, setDesc] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountVal, setDiscountVal] = useState('20');
  const [minOrder, setMinOrder] = useState('100');
  const [maxDiscount, setMaxDiscount] = useState('50');

  // New announcement form
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annService, setAnnService] = useState('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cpRes, annRes] = await Promise.all([
        apiRequest('/api/admin/coupons'),
        apiRequest('/api/admin/announcements')
      ]);
      if (cpRes.success && cpRes.coupons) setCoupons(cpRes.coupons);
      if (annRes.success && annRes.announcements) setAnnouncements(annRes.announcements);
    } catch (err) {
      console.warn('Marketing error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    try {
      const res = await apiRequest('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code,
          description: desc,
          discountType,
          discountValue: discountVal,
          minOrderAmount: minOrder,
          maxDiscountAmount: maxDiscount
        })
      });

      if (res.success) {
        setCode('');
        setDesc('');
        fetchData();
      }
    } catch (err) {
      alert('Error creating coupon');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annMessage) return;

    try {
      const res = await apiRequest('/api/admin/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: annTitle,
          message: annMessage,
          targetService: annService
        })
      });

      if (res.success) {
        setAnnTitle('');
        setAnnMessage('');
        fetchData();
      }
    } catch (err) {
      alert('Error creating announcement');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#17202A] flex items-center gap-2">
            <Tag className="w-6 h-6 text-[#4F9D32]" />
            <span>Campus Marketing, Discounts &amp; Broadcasts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Student promo discount coupons, cart incentives &amp; campus-wide service announcement banners
          </p>
        </div>

        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
          <button
            onClick={() => setActiveTab('COUPONS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'COUPONS'
                ? 'bg-[#4F9D32] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Coupons</span>
          </button>
          <button
            onClick={() => setActiveTab('ANNOUNCEMENTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'ANNOUNCEMENTS'
                ? 'bg-[#4F9D32] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Announcements</span>
          </button>
        </div>
      </div>

      {/* TAB 1: COUPONS */}
      {activeTab === 'COUPONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Coupon Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#4F9D32]" />
              <span>Issue New Promo Coupon</span>
            </h3>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. EXAM2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#17202A] font-mono font-bold uppercase placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Campaign Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. 20% off all night meals during endsems"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1.5">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[#17202A] focus:outline-none focus:border-[#4F9D32]"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat INR (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1.5">
                    Value {discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    value={discountVal}
                    onChange={(e) => setDiscountVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[#17202A] font-mono focus:outline-none focus:border-[#4F9D32]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1.5">
                    Min Cart Order (₹)
                  </label>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[#17202A] font-mono focus:outline-none focus:border-[#4F9D32]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1.5">
                    Max Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[#17202A] font-mono focus:outline-none focus:border-[#4F9D32]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs rounded-xl shadow-sm shadow-[#4F9D32]/20 flex items-center justify-center gap-2 transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Publish Promo Coupon</span>
              </button>
            </form>
          </div>

          {/* Coupons Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Student Promo Codes
              </span>
              <span className="text-xs text-slate-500 font-mono">{coupons.length} total</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Coupon Code</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Min Order</th>
                    <th className="py-3 px-4">Usage State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-[#4F9D32] bg-[#4F9D32]/10 px-2 py-0.5 rounded-md border border-[#4F9D32]/20 text-xs">
                          {c.code}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">{c.description}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-[#17202A]">
                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        ₹{c.minOrderAmount || 0}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#347A27] border border-emerald-200">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANNOUNCEMENTS */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Announcement */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#4F9D32]" />
              <span>Broadcast Campus Announcement</span>
            </h3>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Banner Headline *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Heavy Rain Schedule Adjustment"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Announcement Body *
                </label>
                <textarea
                  rows={3}
                  placeholder="Details displayed on top of student checkout and store pages..."
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[#17202A] placeholder:text-slate-400 focus:outline-none focus:border-[#4F9D32] focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Target Service Stream
                </label>
                <select
                  value={annService}
                  onChange={(e) => setAnnService(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[#17202A] focus:outline-none focus:border-[#4F9D32]"
                >
                  <option value="ALL">Entire Campus (All Services)</option>
                  <option value="FOOD">Food &amp; Meals Only</option>
                  <option value="FRUITS">Fresh Fruits Only</option>
                  <option value="LAUNDRY">Express Laundry Only</option>
                  <option value="ESSENTIALS">Stationery &amp; Essentials Only</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#4F9D32] hover:bg-[#347A27] text-white font-bold text-xs rounded-xl shadow-sm shadow-[#4F9D32]/20 flex items-center justify-center gap-2 transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Publish Broadcast</span>
              </button>
            </form>
          </div>

          {/* Announcements Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Live Campus Broadcasts
              </span>
              <span className="text-xs text-slate-500 font-mono">{announcements.length} active</span>
            </div>

            <div className="divide-y divide-slate-100">
              {announcements.map((a) => (
                <div key={a.id} className="p-5 hover:bg-slate-50/80 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-[#17202A]">{a.title}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4F9D32]/10 text-[#347A27] border border-[#4F9D32]/20">
                      {a.targetService}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{a.message}</p>
                  <div className="text-[10px] text-slate-400 font-mono pt-1">
                    Published: {new Date(a.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
