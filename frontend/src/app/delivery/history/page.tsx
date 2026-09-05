'use client';

import React, { useState } from 'react';
import { useDelivery, HistoryOrder } from '@/context/DeliveryContext';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  IndianRupee,
  MapPin,
  Store,
  ChevronRight,
  ExternalLink,
  Download,
  X,
} from 'lucide-react';

export default function DeliveryHistoryPage() {
  const { deliveryHistory } = useDelivery();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Completed' | 'Cancelled' | 'Rejected'>('All');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<HistoryOrder | null>(null);

  const filteredHistory = deliveryHistory.filter((item) => {
    const matchesSearch =
      item.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = selectedFilter === 'All' ? true : item.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: HistoryOrder['status']) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Delivered</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Cancelled</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-100 px-2.5 py-0.5 rounded-full">
            <XCircle className="w-3 h-3 text-red-600" />
            <span>Rejected</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-6 h-6 text-[#36751F]" />
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                Delivery History & Completed Orders
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Audit log of all campus dispatches, payouts, and customer handovers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('Exporting runner shift log as CSV...')}
              className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID (e.g. #CB10276) or Hostel..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4F9D2F] focus:bg-white transition"
            />
          </div>

          {/* Filter Pills (All, Completed, Cancelled, Rejected) */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
            {(['All', 'Completed', 'Cancelled', 'Rejected'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3.5 py-1.5 rounded-lg transition ${
                  selectedFilter === filter
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List / Table */}
      {filteredHistory.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs divide-y divide-gray-100">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="p-5 hover:bg-gray-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-gray-900 font-mono">
                    {item.orderNumber}
                  </span>
                  {getStatusBadge(item.status)}
                  <span className="text-xs text-gray-400 font-medium">
                    {item.date}
                  </span>
                </div>

                <div className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                  <span className="text-gray-500">{item.pickupLocation}</span>
                  <span className="text-gray-300">→</span>
                  <span className="text-gray-900 font-bold">{item.destination}</span>
                </div>

                <div className="text-[11px] text-gray-400">
                  {item.itemsSummary}
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-gray-400">Payout</div>
                  <div className="text-base font-black text-emerald-700">
                    {item.earning > 0 ? `₹${item.earning}` : '₹0'}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrderDetail(item)}
                  className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition flex items-center gap-1"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Requirement 34: Empty State */
        <div className="card p-12 bg-white text-center border-dashed border-2 border-gray-200 max-w-lg mx-auto my-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
            <History className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-gray-900">
            No completed deliveries yet.
          </h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 mb-4 leading-relaxed">
            {searchQuery || selectedFilter !== 'All'
              ? 'No deliveries match your current search and filter criteria.'
              : 'Complete your first delivery today to see receipts and payout records here.'}
          </p>
          {(searchQuery || selectedFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('All');
              }}
              className="btn-secondary text-xs px-4"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 z-[1200] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-gray-900">
                  {selectedOrderDetail.orderNumber}
                </span>
                {getStatusBadge(selectedOrderDetail.status)}
              </div>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Pickup Location</div>
                <div className="font-bold text-gray-900 mt-0.5">{selectedOrderDetail.pickupLocation}</div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Destination</div>
                <div className="font-bold text-gray-900 mt-0.5">{selectedOrderDetail.destination}</div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Timestamp</div>
                <div className="font-medium text-gray-700 mt-0.5">{selectedOrderDetail.date}</div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Items Delivered</div>
                <div className="font-medium text-gray-700 mt-0.5">{selectedOrderDetail.itemsSummary}</div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                <span className="font-bold text-emerald-900">Payout Credited</span>
                <span className="text-base font-black text-emerald-700">₹{selectedOrderDetail.earning}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderDetail(null)}
              className="w-full py-2.5 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-black transition"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
